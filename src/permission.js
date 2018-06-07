export const PERMISSION = {
  NONE: { canRead: false, canWrite: false, canAdmin: false },
  READ: { canRead: true, canWrite: false, canAdmin: false },
  WRITE: { canRead: true, canWrite: true, canAdmin: false },
  ADMIN: { canRead: true, canWrite: true, canAdmin: true },
};

const getPermissionForRuleName = ruleName => {
  switch (ruleName) {
    case 'read':
      return PERMISSION.READ;
    case 'write':
      return PERMISSION.WRITE;
    case 'admin':
      return PERMISSION.ADMIN;
    default:
      return PERMISSION.NONE;
  }
};

export const addPermissions = (a, b) => ({
  canRead: a.canRead || b.canRead,
  canWrite: a.canWrite || b.canWrite,
  canAdmin: a.canAdmin || b.canAdmin,
});

export const getPermissions = (metaDoc, authName) => {
  if (metaDoc.owner === authName) {
    return PERMISSION.ADMIN;
  }
  let outputPermission = PERMISSION.NONE;
  if (metaDoc.permissions) {
    metaDoc.permissions.forEach(rule => {
      if (rule.authName === authName) {
        outputPermission = addPermissions(
          outputPermission,
          getPermissionForRuleName(rule.role),
        );
      }
    });
  }
  if (metaDoc.isPublic) {
    outputPermission = addPermissions(outputPermission, PERMISSION.READ);
  }
  return outputPermission;
};
