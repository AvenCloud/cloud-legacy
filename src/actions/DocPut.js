import { object, string, array, bool } from 'yup';
import { putDoc, putDocMeta, getDocMeta } from '../data';
import { PRIMARY_DOMAIN, verifySessionAuth } from '../auth';
import { publish, subscribe } from '../pubsub';
import { getPermissions } from '../permission';
import { config } from '../config';
import {
  authenticatedAction,
  isDocName,
  isAuthName,
  isPermissionRule,
} from '../commonSchema';

export const schema = object()
  .noUnknown()
  .shape({
    type: string().oneOf(['DocPut']),
    owner: isAuthName,
    docName: isDocName,
    lastDocId: string().notRequired(),
    doc: object().notRequired(),
    isPublic: bool().notRequired(),
    permissions: array()
      .notRequired()
      .of(isPermissionRule),
    ...authenticatedAction,
  });

subscribe('doc-will-update', msg => {
  console.log('DocPut sees doc-will-update' + config.INSTANCE_ID, {
    msg,
  });
});
subscribe('doc-did-update', msg => {
  console.log('DocPut sees doc-did-update ' + config.INSTANCE_ID, {
    msg,
  });
});

export default async function DocPut(action) {
  // const updateTime = Date.now();
  const { authName } = await verifySessionAuth(action);
  if (!authName) {
    throw new Error('Invalid Authentication');
  }
  // subscribeToDocUpdates()

  const { owner, docName, doc, isPublic, permissions } = action;
  const domain = action.domain || PRIMARY_DOMAIN;
  const metaDocData = (await getDocMeta(domain, owner, docName)) || {};
  const metaDoc = { ...metaDocData, docName, owner, domain };
  const { canWrite, canAdmin } = getPermissions(metaDoc, authName);
  const outputMeta = { ...metaDoc };
  if (!canWrite) {
    throw new Error('Invalid Authentication');
  }

  if (metaDoc.docId && action.doc && action.lastDocId !== metaDoc.docId) {
    throw new Error('Invalid lastDocId!');
  }
  publish('doc-will-update', {
    ...outputMeta,
  });
  // so we fired doc-will-update, but may still reach an error. I suppose it really means "MAY" update!

  if (doc) {
    const outputDoc = {
      ...doc,
      ...outputMeta,
    };
    outputMeta.lastDocId = outputMeta.docId;
    outputMeta.docId = await putDoc(domain, authName, docName, outputDoc);
  }

  if (isPublic != null || permissions) {
    if (!canAdmin) {
      throw new Error('Invalid Authentication');
    }
    outputMeta.isPublic = isPublic == null ? outputMeta.isPublic : isPublic;
    outputMeta.permissions =
      permissions == null ? outputMeta.permissions : permissions;
  }

  // perhaps transfer logic, plz test this:
  // if (action.transferOwner) {
  //   if (owner !== authName) {
  //     throw new Error('Invalid Authentication');
  //   }
  //   // more transer logic here. copy doc from owner to transferOwner, deleting source
  //   outputMeta.owner = action.transferOwner;
  // }

  if (
    metaDoc.isPublic !== outputMeta.isPublic ||
    metaDoc.permissions !== outputMeta.permissions ||
    metaDoc.docId !== outputMeta.docId
  ) {
    await putDocMeta(domain, owner, docName, outputMeta);
  }

  publish('doc-did-update', outputMeta);

  return outputMeta;
}
//   if (
//     !owner === authName ||
//     (!metaDoc.permissions ||
//     !metaDoc.permissions.find(
//       rule => rule.account === authName && rule.role === 'write',
//     ))
//   ) {
//     throw new Error('Invalid Authentication');
//   }

//   if (owner === authName) {
//     if (isPublic != null || permissions != null) {
//       const meta = {
//         ...metaDoc,
//         isPublic: isPublic != null ? isPublic : !!metaDoc.isPublic,
//         permissions: permissions || metaDoc.permissions || [],
//       };
//       await putDocMeta(domain, authName, docName, meta);
//     }
//     if (doc) {
//     }
//     await Promise.all([
//       async () => {
//         await putDocMeta(domain, authName, docName, {
//           ...metaDoc,
//           docId,
//         });
//       },

//   docId = await putDoc(
//       domain,
//       owner,
//       docName,
//       outputDoc,
//     );
//     return { ...metaDoc, owner, docName, docId, lastDocId };
//   }
//   throw new Error('Invalid Authentication');
// }

// action.owner
// action.docName
// action.version
// action.doc
// action.isPublic
// action.permissions
