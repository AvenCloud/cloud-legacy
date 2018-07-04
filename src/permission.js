export const PERMISSION = {
  NONE: { canRead: false, canWrite: false, canForce: false, canAdmin: false },
  READ: { canRead: true, canWrite: false, canForce: false, canAdmin: false },
  WRITE: { canRead: true, canWrite: true, canForce: false, canAdmin: false },
  FORCE: { canRead: true, canWrite: true, canForce: true, canAdmin: false },
  ADMIN: { canRead: true, canWrite: true, canForce: true, canAdmin: true },
};

export const getPermissionForRuleName = ruleName => {
  switch (ruleName) {
    case 'read':
      return PERMISSION.READ;
    case 'write':
      return PERMISSION.WRITE;
    case 'force':
      return PERMISSION.FORCE;
    case 'admin':
      return PERMISSION.ADMIN;
    default:
      return PERMISSION.NONE;
  }
};

export const addPermissions = (a, b) => ({
  canRead: a.canRead || b.canRead,
  canWrite: a.canWrite || b.canWrite,
  canForce: a.canForce || b.canForce,
  canAdmin: a.canAdmin || b.canAdmin,
});

// export const getPermissions = (metaDoc, authName) => {
//   if (metaDoc.owner === authName) {
//     return PERMISSION.ADMIN;
//   }
//   let outputPermission = PERMISSION.NONE;
//   if (metaDoc.permissions) {
//     metaDoc.permissions.forEach(rule => {
//       if (rule.authName === authName) {
//         outputPermission = addPermissions(
//           outputPermission,
//           getPermissionForRuleName(rule.role),
//         );
//       }
//     });
//   }
//   if (metaDoc.isPublic) {
//     outputPermission = addPermissions(outputPermission, PERMISSION.READ);
//   }
//   return outputPermission;
// };
