import { PERMISSION, addPermissions, getPermissions } from '../permission';

const { NONE, READ, WRITE, ADMIN } = PERMISSION;

test('permission basics', () => {
  expect(NONE.canRead).toEqual(false);
  expect(NONE.canWrite).toEqual(false);
  expect(NONE.canAdmin).toEqual(false);
  expect(READ.canRead).toEqual(true);
  expect(READ.canWrite).toEqual(false);
  expect(READ.canAdmin).toEqual(false);
  expect(WRITE.canRead).toEqual(true);
  expect(WRITE.canWrite).toEqual(true);
  expect(WRITE.canAdmin).toEqual(false);
  expect(ADMIN.canRead).toEqual(true);
  expect(ADMIN.canWrite).toEqual(true);
  expect(ADMIN.canAdmin).toEqual(true);
});

test('permission adding', () => {
  expect(addPermissions(NONE, NONE).canRead).toEqual(false);
  expect(addPermissions(NONE, NONE).canWrite).toEqual(false);
  expect(addPermissions(NONE, NONE).canAdmin).toEqual(false);
  expect(addPermissions(NONE, READ).canRead).toEqual(true);
  expect(addPermissions(NONE, READ).canWrite).toEqual(false);
  expect(addPermissions(NONE, READ).canAdmin).toEqual(false);
  expect(addPermissions(ADMIN, READ).canRead).toEqual(true);
  expect(addPermissions(ADMIN, READ).canWrite).toEqual(true);
  expect(addPermissions(ADMIN, READ).canAdmin).toEqual(true);
});

test('permissions for meta docs', () => {
  expect(getPermissions({}, 'jane')).toEqual(NONE);
  expect(getPermissions({ isPublic: false }, 'jane')).toEqual(NONE);
  expect(getPermissions({ isPublic: true }, 'jane')).toEqual(READ);
  expect(getPermissions({ isPublic: false }, null)).toEqual(NONE);
  expect(getPermissions({ isPublic: true }, null)).toEqual(READ);
  expect(getPermissions({ owner: 'jane' }, 'jack')).toEqual(NONE);
  expect(getPermissions({ owner: 'jane' }, 'jane')).toEqual(ADMIN);
  expect(
    getPermissions(
      {
        isPublic: true,
        permissions: [{ authName: 'jane', role: 'admin' }],
        owner: 'jill',
      },
      'jack',
    ),
  ).toEqual(READ);
  expect(
    getPermissions(
      {
        permissions: [
          { authName: 'jane', role: 'admin' },
          { authName: 'jack', role: 'write' },
        ],
        owner: 'jill',
      },
      'jack',
    ),
  ).toEqual(WRITE);
});
