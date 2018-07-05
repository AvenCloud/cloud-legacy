const uuid = require('uuid/v1');
const { schema, getSqlType } = require('./schema');
const crypto = require('crypto');
const stringify = require('json-stable-stringify');

const { Client } = require('pg');

const activeDomains = new Set([process.env.CLOUD_PRIMARY_HOST]);

const startService = async ({
  user,
  host,
  database,
  password,
  port,
  ssl,
  name,
}) => {
  name = name || `db-${uuid()}`;

  const pg = new Client({
    user,
    host,
    database,
    password,
    port,
    ssl,
  });

  let connected = false;
  let migrated = false;

  async function connect() {
    if (!connected) {
      await pg.connect();
      connected = true;
    }
  }
  async function getTables() {
    const schemaQuery = await pg.query('SELECT * FROM pg_catalog.pg_tables;');
    const tableNames = schemaQuery.rows
      .filter(r => r.schemaname === 'public')
      .map(r => r.tablename);
    return new Set(tableNames);
  }
  async function getColumns(tableName) {
    const schemaQuery = await pg.query(
      'SELECT * FROM information_schema.columns;',
    );
    const columns = schemaQuery.rows
      .filter(r => r.table_schema === 'public')
      .filter(r => r.table_name === tableName)
      .map(r => ({
        columnName: r.column_name,
        isNullable: r.is_nullable,
        dataType: r.data_type,
      }));

    return columns;
  }
  async function createTable(tableName) {
    await pg.query(`CREATE TABLE ${tableName} ();`);
  }
  async function getPrimaryIndexes(tableName) {
    const schemaQuery = await pg.query(`
    SELECT a.attname, format_type(a.atttypid, a.atttypmod) AS data_type
FROM   pg_index i
JOIN   pg_attribute a ON a.attrelid = i.indrelid
                     AND a.attnum = ANY(i.indkey)
WHERE  i.indrelid = '${tableName}'::regclass
AND    i.indisprimary;
`);
    const indexes = schemaQuery.rows.map(r => ({
      name: r.attname,
      dataType: r.data_type,
    }));
    return indexes;
  }

  async function migrateColumnRef(tableName, columnName, column) {
    const constraintName = `${tableName}_${columnName}_fkey`;
    const lastConstraints = await pg.query(`
    SELECT
    tc.constraint_name, tc.table_name, kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE constraint_type = 'FOREIGN KEY'
`);
    if (lastConstraints.rows.find(r => r.constraint_name === constraintName)) {
      return;
    }
    const sourceRefs = Object.keys(column.ref).filter(r => r[0] !== '_');
    await pg.query(
      `ALTER TABLE ${tableName} ADD CONSTRAINT ${constraintName} FOREIGN KEY (${sourceRefs.join(
        ', ',
      )}) REFERENCES ${column.ref._table}(${sourceRefs
        .map(r => column.ref[r])
        .join(', ')}) ${column.ref._cascadeDelete ? 'ON DELETE CASCADE' : ''}`,
    );
  }

  async function migrateColumn(tableName, columnName, lastColumn, column) {
    const sqlType = getSqlType(column.columnType);
    if (lastColumn && lastColumn.dataType === sqlType.toLowerCase()) {
      return;
    }
    if (lastColumn) {
      throw new Error(
        'Must migrate data type! ' +
          tableName +
          ' ' +
          columnName +
          ' ' +
          sqlType,
      );
    }
    await pg.query(
      `ALTER TABLE ${tableName} ADD COLUMN "${columnName}" ${sqlType};`,
    );
  }

  async function migrateTablePrimaryIndex(tableName, primary) {
    const lastIndexes = await getPrimaryIndexes(tableName);
    if (
      lastIndexes.length === primary.length &&
      !lastIndexes.find(l => primary.indexOf(l.name) === -1)
    ) {
      return;
    }

    await pg.query(
      `CREATE UNIQUE INDEX ${tableName}_pkey ON ${tableName} (${primary.join(
        ', ',
      )});`,
    );
    await pg.query(
      `ALTER TABLE ${tableName} ADD PRIMARY KEY USING INDEX ${tableName}_pkey;`,
    );
  }

  async function migrateTable(name, tableSchema) {
    const tables = await getTables();
    if (!tables.has(name)) {
      await createTable(name);
    }
    const lastColumns = await getColumns(name);

    const columnNames = Object.keys(tableSchema.columns);

    for (let i = 0; i < columnNames.length; i++) {
      const columnName = columnNames[i];
      const column = tableSchema.columns[columnName];
      const lastColumn = lastColumns.find(c => c.columnName === columnName);
      await migrateColumn(name, columnName, lastColumn, column);
    }

    await migrateTablePrimaryIndex(name, tableSchema.primary);

    for (let i = 0; i < columnNames.length; i++) {
      const columnName = columnNames[i];
      const column = tableSchema.columns[columnName];

      if (column.ref) {
        await migrateColumnRef(name, columnName, column);
      }
    }
  }

  async function migrate() {
    await connect();

    const tableNames = Object.keys(schema.tables);

    for (let i = 0; i < tableNames.length; i++) {
      const tableName = tableNames[i];
      const tableSchema = schema.tables[tableName];
      await migrateTable(tableName, tableSchema);
    }
    migrated = true;
  }

  async function init() {
    await migrate();
  }

  async function putObject({ object }) {
    const objData = stringify(object);
    const size = objData.length;
    const sha = crypto.createHash('sha1');
    sha.update(objData);
    const id = sha.digest('hex');
    await pg.query(
      'INSERT INTO objects (id, json, size) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [id, object, size],
    );
    return { id };
  }
  async function putBinaryObject(buffer) {
    throw new Error('Coming soon');
    return { id: 'coming soon' };
  }

  async function getRef({ domain, ref }) {
    const res = await pg.query(
      'SELECT owner, active_object, is_public FROM refs WHERE id = $1 AND domain = $2',
      [ref, domain],
    );
    if (res.rowCount < 1) {
      return null;
    }
    const { owner } = res.rows[0];
    const id = res.rows[0].active_object;
    const isPublic = res.rows[0].is_public;
    return { id, ref, domain, owner, isPublic };
  }

  async function getObject({ id }) {
    const res = await pg.query('SELECT * FROM objects WHERE id = $1', [id]);
    if (res.rowCount < 1) {
      return null;
    }
    const object = res.rows[0].json;
    return { id, object };
  }

  async function getObjectViaRef({ id, ref, domain }) {
    const res = await pg.query(
      'SELECT objects.json, objects.binary FROM objects, object_refs WHERE object_refs.object = objects.id AND object_refs.object = $1 AND object_refs.ref = $2 AND object_refs.domain = $3',
      [id, ref, domain],
    );
    if (res.rowCount < 1) {
      return null;
    }
    const object = res.rows[0].json;
    return { id, ref, object };
  }

  async function getRefObject({ domain, ref }) {
    const refData = await getRef({ domain, ref }); // todo, use a join in postgres for this
    if (!refData) {
      return null;
    }
    const { id, owner } = refData;
    const object = await getObject({ id });
    return { domain, ref, id, owner, object: object && object.object };
  }

  async function ensureDomain(domain) {
    if (!activeDomains.has(domain)) {
      throw new Error('Invalid domain!');
    }
    await pg.query(
      'INSERT INTO domains (name) VALUES ($1) ON CONFLICT DO NOTHING',
      [domain],
    );
  }

  async function ensureRef(domain, ref, defaultOwner) {
    await pg.query(
      'INSERT INTO refs (id, domain, owner) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [ref, domain, defaultOwner],
    );
  }

  async function ensureObjectRef(domain, ref, objectId) {
    await pg.query(
      'INSERT INTO object_refs (ref, domain, object) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [ref, domain, objectId],
    );
  }

  async function setRefActiveObject({ domain, ref, id }) {
    await pg.query(
      'UPDATE refs SET active_object = $3 WHERE id = $1 AND domain = $2 ',
      [ref, domain, id],
    );
  }
  async function destroyRefObjects({ domain, ref }) {
    await pg.query('DELETE FROM object_refs WHERE domain = $1 AND ref = $2 ', [
      domain,
      ref,
    ]);
  }

  async function destroyRef({ domain, ref }) {
    await pg.query('DELETE FROM refs WHERE domain = $1 AND ref = $2 ', [
      ref,
      domain,
    ]);
  }

  async function setRefOwner(domain, ref, owner) {
    await pg.query(
      'UPDATE refs SET owner = $3 WHERE id = $1 AND domain = $2 ',
      [ref, domain, owner],
    );
  }

  async function setRefIsPublic({ domain, ref, isPublic }) {
    await pg.query(
      'UPDATE refs SET is_public = $1 WHERE id = $2 AND domain = $3',
      [isPublic, ref, domain],
    );
  }

  async function listRefObjects({ domain, ref }) {
    const result = await pg.query(
      'SELECT objects.id, objects.size FROM objects, object_refs WHERE object_refs.object = objects.id AND object_refs.domain = $1 AND object_refs.ref = $2',
      [domain, ref],
    );
    return result.rows;
  }

  async function listRefs({ domain }) {
    const result = await pg.query('SELECT id FROM refs WHERE domain = $1', [
      domain,
    ]);
    return result.rows;
  }

  async function putRefPermission({ domain, ref, owner, permission }) {
    await pg.query('BEGIN');
    try {
      await pg.query(
        'DELETE FROM permissions WHERE ref = $1 AND domain = $2 AND owner = $3',
        [domain, ref, owner],
      );
      await pg.query(
        'INSERT INTO permissions (ref, domain, owner, permission) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
        [ref, domain, owner, permission],
      );
      await pg.query('COMMIT');
    } catch (e) {
      console.error(e);
      await pg.query('ROLLBACK');
      throw e;
    }
  }

  async function getRefPermissions({ domain, ref }) {
    const result = await pg.query(
      'SELECT permission, owner FROM permissions WHERE domain = $1 AND ref = $2',
      [domain, ref],
    );
    return result.rows;
  }

  async function putRefObject({ domain, ref, object, owner, defaultOwner }) {
    console.log(domain, ref, object, owner, defaultOwner);
    await pg.query('BEGIN');
    try {
      await ensureDomain(domain);
      await ensureRef(domain, ref, defaultOwner);
      const { id } = await putObject({ object });
      await ensureObjectRef(domain, ref, id);
      await setRefActiveObject({ domain, ref, id });
      owner && (await setRefOwner(domain, ref, owner));
      await pg.query('COMMIT');
    } catch (e) {
      console.error(e);
      await pg.query('ROLLBACK');
    }
  }

  async function status() {
    return { connected, migrated };
  }

  const actions = {
    putRefObject,
    putBinaryObject,
    putObject,
    getObject,
    getObjectViaRef,
    getRef,
    listRefs,
    listRefObjects,
    getRefPermissions,
    setRefIsPublic,
    setRefActiveObject,
    destroyRefObjects,
    destroyRef,
    putRefPermission,
    getRefObject,
    status,
  };

  await init();

  return {
    actions,
    remove: async () => {
      await pg.end();
    },
    name,
  };
};

module.exports = { startService };
