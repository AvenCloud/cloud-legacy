import { object, string, array, bool } from 'yup';
import { putDoc, putDocMeta, getDocMeta } from '../data';
import { PRIMARY_DOMAIN, verifySessionAuth } from '../auth';
import { publish, subscribe } from '../pubsub';
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
    doc: object().notRequired(),
    isPublic: bool().notRequired(),
    permissions: array()
      .notRequired()
      .of(isPermissionRule),
    ...authenticatedAction,
  });

subscribe('doc-will-update', msg => {
  console.log('DocPut doc-will-update' + config.INSTANCE_ID, {
    msg,
  });
});
subscribe('doc-did-update', msg => {
  console.log('DocPut doc-did-update ' + config.INSTANCE_ID, {
    msg,
  });
});

export default async function DocPut(action) {
  const { authName } = await verifySessionAuth(action);
  if (!authName) {
    throw new Error('Invalid authentication');
  }
  const { owner, docName, doc, isPublic, permissions } = action;
  const domain = action.domain || PRIMARY_DOMAIN;
  const willUpdatePayload = {
    type: 'WillUpdate',
    docName,
    owner,
  };
  const didUpdatePayload = {
    ...willUpdatePayload,
    type: 'DidUpdate',
  };
  let docId = undefined;
  if (owner === authName) {
    if (isPublic != null || permissions != null) {
      publish('doc-will-update', willUpdatePayload);
      const metaDoc = await getDocMeta(domain, authName, docName);
      const lastMeta = metaDoc || {};
      const meta = {
        ...lastMeta,
        isPublic: isPublic != null ? isPublic : !!lastMeta.isPublic,
        permissions: permissions || lastMeta.permissions || [],
      };
      await putDocMeta(domain, authName, docName, meta);
      publish('doc-did-update', didUpdatePayload);
    }
    if (doc) {
      docId = await putDoc(domain, authName, docName, doc);
    }
    return { ...lastMeta, owner, docName, docId };
  }
  const docMeta = await getDocMeta(domain, owner, docName);

  if (
    docMeta &&
    docMeta.permissions &&
    docMeta.permissions.find(
      rule => rule.account === authName && rule.role === 'write',
    )
  ) {
    publish('doc-will-update', willUpdatePayload);
    docId = didUpdatePayload.docId = await putDoc(domain, owner, docName, doc);

    publish('doc-did-update', didUpdatePayload);
    return { ...docMeta, owner, docName, docId };
  }
  throw new Error('Invalid authentication');
}

// action.owner
// action.docName
// action.version
// action.doc
// action.isPublic
// action.permissions
