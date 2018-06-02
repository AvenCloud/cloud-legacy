import { object, string, array, bool } from 'yup';
import { putDoc, putDocMeta, getDocMeta } from '../data';
import { PRIMARY_DOMAIN, verifySessionAuth } from '../auth';
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
    doc: object().notRequired(),
    isPublic: bool().notRequired(),
    permissions: array()
      .notRequired()
      .of(isPermissionRule),
    ...authenticatedAction,
  });

export default async function DocPut(action) {
  const { authName } = await verifySessionAuth(action);
  if (!authName) {
    throw new Error({
      message: 'Invalid authentication',
    });
  }
  const { owner, docName, doc, isPublic, permissions } = action;
  const domain = action.domain || PRIMARY_DOMAIN;
  if (owner === authName) {
    if (isPublic != null || permissions != null) {
      const metaDoc = await getDocMeta(domain, authName, docName);
      const lastMeta = metaDoc || {};
      const meta = {
        ...lastMeta,
        isPublic: isPublic != null ? isPublic : !!lastMeta.isPublic,
        permissions: permissions || lastMeta.permissions || [],
      };
      await putDocMeta(domain, authName, docName, meta);
    }
    if (doc) {
      await putDoc(domain, authName, docName, doc);
    }
    return;
  }
  const docMeta = await getDocMeta(domain, owner, docName);

  if (
    docMeta &&
    docMeta.permissions &&
    docMeta.permissions.find(
      rule => rule.account === authName && rule.role === 'write',
    )
  ) {
    await putDoc(domain, owner, docName, doc);
    return;
  }
  throw new Error({
    message: 'Invalid authentication',
  });
}

// action.owner
// action.docName
// action.version
// action.doc
// action.isPublic
// action.permissions
