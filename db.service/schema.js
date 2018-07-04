const getSqlType = columnType => {
  switch (columnType) {
    case 'shortstring':
      // shortstring , lowercase alphanum, start with letter, dashes ok, not too long
      return 'TEXT';
    case 'json':
      return 'JSON';
    case 'binary':
      return 'BYTEA';
    case 'enum':
      return 'TEXT';
    case 'boolean':
      return 'BOOLEAN';
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
    refs: TableSchema({
      columns: {
        id: ColumnSchema('shortstring'),
        domain: ColumnSchema('shortstring', {
          refToTable: 'domains',
          refToColumn: 'name',
        }),
        is_public: ColumnSchema('boolean'),
        owner: ColumnSchema('shortstring', {
          refToTable: 'refs',
          refToColumn: 'id',
        }),
        active_object: ColumnSchema('shortstring', {
          refToTable: 'objects',
          refToColumn: 'id',
        }),
      },
      primary: ['domain', 'id'],
    }),
    permissions: TableSchema({
      columns: {
        role: ColumnSchema('shortstring', {
          refToTable: 'refs',
          refToColumn: 'id',
        }),
        ref: ColumnSchema('shortstring', {
          refToTable: 'refs',
          refToColumn: 'id',
        }),
        domain: ColumnSchema('shortstring', {
          refToTable: 'domains',
          refToName: 'name',
        }),
        permission: ColumnSchema('enum', {
          options: ['read', 'write', 'force', 'admin'],
        }),
      },
      primary: ['ref', 'permission', 'role', 'domain'],
    }),
    object_refs: TableSchema({
      columns: {
        ref: ColumnSchema('shortstring', {
          refToTable: 'refs',
          refToColumn: 'id',
        }),
        domain: ColumnSchema('shortstring', {
          refToTable: 'domains',
          refToColumn: 'name',
        }),
        object: ColumnSchema('shortstring', {
          refToTable: 'objects',
          refToColumn: 'id',
        }),
      },
      primary: ['ref', 'object'],
    }),
  },
});

module.exports = { getSqlType, schema, DBSchema, TableSchema, ColumnSchema };
