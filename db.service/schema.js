const getSqlType = columnType => {
  switch (columnType) {
    case 'shortstring':
      // shortstring , lowercase alphanum, start with letter, dashes ok, not too long
      return 'TEXT';
    case 'json':
      return 'JSON';
    case 'binary':
      return 'BYTEA';
    case 'int':
      return 'INTEGER';
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
const ColumnSchema = (type, { options, ref } = {}) => ({
  type: 'column',
  columnType: type,
  options,
  ref,
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
        size: ColumnSchema('int'),
        json: ColumnSchema('json'),
        binary: ColumnSchema('binary'),
      },
      primary: ['id'],
    }),
    refs: TableSchema({
      columns: {
        id: ColumnSchema('shortstring'),
        domain: ColumnSchema('shortstring', {
          ref: {
            _table: 'domains',
            domain: 'name',
          },
        }),
        is_public: ColumnSchema('boolean'),
        owner: ColumnSchema('shortstring', {
          ref: {
            _table: 'refs',
            owner: 'id',
            domain: 'domain',
          },
        }),
        active_object: ColumnSchema('shortstring', {
          ref: {
            _table: 'objects',
            active_object: 'id',
          },
        }),
      },
      primary: ['domain', 'id'],
    }),
    permissions: TableSchema({
      columns: {
        owner: ColumnSchema('shortstring', {
          ref: {
            _table: 'refs',
            _cascadeDelete: true,
            owner: 'id',
            domain: 'domain',
          },
        }),
        ref: ColumnSchema('shortstring', {
          ref: {
            _table: 'refs',
            _cascadeDelete: true,
            ref: 'id',
            domain: 'domain',
          },
        }),
        domain: ColumnSchema('shortstring', {
          ref: {
            _table: 'domains',
            _cascadeDelete: true,
            domain: 'name',
          },
        }),
        permission: ColumnSchema('enum', {
          options: ['read', 'write', 'force', 'admin'],
        }),
      },
      primary: ['ref', 'permission', 'owner', 'domain'],
    }),
    object_refs: TableSchema({
      columns: {
        ref: ColumnSchema('shortstring', {
          ref: {
            _table: 'refs',
            _cascadeDelete: true,
            ref: 'id',
            domain: 'domain',
          },
        }),
        domain: ColumnSchema('shortstring', {
          ref: {
            _table: 'domains',
            _cascadeDelete: true,
            domain: 'name',
          },
        }),
        object: ColumnSchema('shortstring', {
          ref: {
            _table: 'objects',
            _cascadeDelete: true,
            object: 'id',
          },
        }),
      },
      primary: ['ref', 'object'],
    }),
  },
});

module.exports = { getSqlType, schema, DBSchema, TableSchema, ColumnSchema };
