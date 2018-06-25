const { Client } = require('pg');

// column types:
// shortstring , lowercase alphanum, start with letter, dashes ok, not too long
// json
// binary
// enum, (options)
// boolean

const getSqlType = columnType => {
  switch (columnType) {
    case 'shortstring':
      return 'TEXT';
    case 'json':
      return 'JSON';
    case 'boolean':
      return 'BOOLEAN';
    case 'binary':
      return 'BYTEA';
    case 'enum':
      return 'TEXT';
  }
};
const DBSchema = ({ tables }) => ({ tables });
const TableSchema = ({ columns, primary }) => ({
  type: 'table',
  columns,
  primary,
});
const ColumnSchema = (type, { options, refToTable, refToColumn } = {}) => ({
  type: 'column',
  columnType: type,
  options,
  refToTable,
  refToColumn,
});

const schema = DBSchema({
  tables: {
    domains: TableSchema({
      columns: {
        name: ColumnSchema('shortstring'),
      },
      primary: ['name'],
    }),
    objects: TableSchema({
      columns: {
        id: ColumnSchema('shortstring'),
        json: ColumnSchema('json'),
        binary: ColumnSchema('binary'),
      },
      primary: ['id'],
    }),
    records: TableSchema({
      columns: {
        id: ColumnSchema('shortstring'),
        domain: ColumnSchema('shortstring', {
          refToTable: 'domains',
          refToColumn: 'name',
        }),
        isPublic: ColumnSchema('boolean'),
      },
      primary: ['domain', 'id'],
    }),
    permissions: TableSchema({
      columns: {
        role: ColumnSchema('shortstring', {
          refToTable: 'records',
          refToColumn: 'id',
        }),
        record: ColumnSchema('shortstring', {
          refToTable: 'records',
          refToColumn: 'id',
        }),
        permission: ColumnSchema('enum', {
          options: ['read', 'write', 'force', 'admin'],
        }),
      },
      primary: ['record', 'permission', 'role'],
    }),
    objectrecords: TableSchema({
      columns: {
        record: ColumnSchema('shortstring', {
          refToTable: 'records',
          refToColumn: 'id',
        }),
        object: ColumnSchema('shortstring', {
          refToTable: 'objects',
          refToColumn: 'id',
        }),
      },
      primary: ['record', 'object'],
    }),
  },
});

class DB {
  constructor({ user, host, database, password, port, ssl }) {
    this._schema = schema;
    this._pg = new Client({
      user,
      host,
      database,
      password,
      port,
      ssl,
    });
    this._connected = false;
  }

  async connect() {
    if (!this._connected) {
      await this._pg.connect();
      this._connected = true;
    }
  }

  async migrateColumn(tableName, columnName, lastColumn, column) {
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
    await this._pg.query(
      `ALTER TABLE ${tableName} ADD COLUMN "${columnName}" ${sqlType};`,
    );
  }

  async migrateTablePrimaryIndex(tableName, primary) {
    const lastIndexes = await this.getPrimaryIndexes(tableName);
    if (
      lastIndexes.length === primary.length &&
      !lastIndexes.find(l => primary.indexOf(l.name) === -1)
    ) {
      return;
    }

    await this._pg.query(
      `CREATE UNIQUE INDEX ${tableName}_pkey ON ${tableName} (${primary.join(
        ', ',
      )});`,
    );
    await this._pg.query(
      `ALTER TABLE ${tableName} ADD PRIMARY KEY USING INDEX ${tableName}_pkey;`,
    );
  }

  async migrateTable(name, tableSchema) {
    const tables = await this.getTables();
    if (!tables.has(name)) {
      await this.createTable(name);
    }
    const lastColumns = await this.getColumns(name);

    const columnNames = Object.keys(tableSchema.columns);

    for (let i = 0; i < columnNames.length; i++) {
      const columnName = columnNames[i];
      const column = tableSchema.columns[columnName];
      const lastColumn = lastColumns.find(c => c.columnName === columnName);
      await this.migrateColumn(name, columnName, lastColumn, column);
    }

    await this.migrateTablePrimaryIndex(name, tableSchema.primary);
  }

  async migrate() {
    await this.connect();

    const tableNames = Object.keys(this._schema.tables);

    for (let i = 0; i < tableNames.length; i++) {
      const tableName = tableNames[i];
      const tableSchema = this._schema.tables[tableName];
      await this.migrateTable(tableName, tableSchema);
    }
  }

  async establish() {
    await this.migrate();
  }

  async createTable(tableName) {
    await this._pg.query(`CREATE TABLE ${tableName} ();`);
  }

  async getTables() {
    const schemaQuery = await this._pg.query(
      'SELECT * FROM pg_catalog.pg_tables;',
    );
    const tableNames = schemaQuery.rows
      .filter(r => r.schemaname === 'public')
      .map(r => r.tablename);
    return new Set(tableNames);
  }

  async getColumns(tableName) {
    const schemaQuery = await this._pg.query(
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

  async getPrimaryIndexes(tableName) {
    const schemaQuery = await this._pg.query(`
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

  async test() {
    console.log('Testing DB connector');
    await this.connect();

    console.log('establish: ', await this.establish());
    // console.log('getPrimaryIndexes: ', await this.getPrimaryIndexes('domains'));
    // console.log('getTables: ', await this.getTables());
    // console.log('getColumns: ', await this.getColumns('users'));
  }
}

const db = new DB({
  user: 'cloud',
  host: 'titan.aven.cloud',
  database: 'cloud',
  password: 'explode-such-banana47',
  port: 5432,
  ssl: true,
});

db.test()
  .then(() => console.log('Testing Done'))
  .catch(console.error);
