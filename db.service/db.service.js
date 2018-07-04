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
    const sha = crypto.createHash('sha1');
    sha.update(objData);
    const id = sha.digest('hex');
    await pg.query(
      'INSERT INTO objects (id, json) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [id, object],
    );
    return { id };
  }
  async function putBinaryObject(buffer) {
    return { id: 'coming soon' };
  }

  async function getRef({ domain, ref }) {
    const res = await pg.query(
      'SELECT owner, active_object FROM refs WHERE id = $1 AND domain = $2',
      [ref, domain],
    );
    if (res.rowCount < 1) {
      return null;
    }
    const { owner } = res.rows[0];
    const id = res.rows[0].active_object;
    return { id, ref, domain, owner };
  }

  async function getObject({ id }) {
    const res = await pg.query('SELECT * FROM objects WHERE id = $1', [id]);
    if (res.rowCount < 1) {
      return null;
    }
    const object = res.rows[0].json;
    return { id, object };
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

  async function ensureRef(domain, ref) {
    await pg.query(
      'INSERT INTO refs (id, domain) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [ref, domain],
    );
  }

  async function ensureObjectRef(domain, ref, objectId) {
    await pg.query(
      'INSERT INTO object_refs (ref, domain, object) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [ref, domain, objectId],
    );
  }

  async function setActiveRefObject(domain, ref, objectId) {
    await pg.query(
      'UPDATE refs SET active_object = $3 WHERE id = $1 AND domain = $2 ',
      [ref, domain, objectId],
    );
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

  async function putPermission(domain, ref, user, role) {
    await pg.query(
      'INSERT INTO permissions (ref, domain, permission, role) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
      [domain, ref, role, permission],
    );
  }

  async function putRefObject({ domain, ref, object, owner }) {
    await pg.query('BEGIN');
    try {
      await ensureDomain(domain);
      await ensureRef(domain, ref);
      const { id } = await putObject({ object });
      await ensureObjectRef(domain, ref, id);
      await setActiveRefObject(domain, ref, id);
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
    getRef,
    setRefIsPublic,
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
