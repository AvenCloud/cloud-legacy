import { object, string } from 'yup';
import { getDoc, getDocMeta } from '../data';
import { PRIMARY_DOMAIN, verifySessionAuth } from '../auth';
import {
  optionallyAuthenticatedAction,
  isAuthName,
  isDocName,
} from '../commonSchema';

const canRoleRead = role => role === 'write' || role === 'read';

export const schema = object()
  .noUnknown()
  .shape({
    type: string().oneOf(['DocGet']),
    owner: isAuthName,
    docName: isDocName,
    ...optionallyAuthenticatedAction,
  });

export default async function DocGet(action) {
  const { authName } = await verifySessionAuth(action);

  const doc = await getDoc(
    action.domain || PRIMARY_DOMAIN,
    action.owner,
    action.docName,
  );
  if (!doc) {
    return null;
  }
  if (action.owner === authName) {
    return doc;
  }
  const docMeta = await getDocMeta(
    action.domain || PRIMARY_DOMAIN,
    action.owner,
    action.docName,
  );
  if (!docMeta) {
    return null;
  }
  if (docMeta.isPublic) {
    return doc;
  }
  if (
    docMeta.permissions.find(
      permission =>
        permission.account === authName && canRoleRead(permission.role),
    )
  ) {
    return doc;
  }
}

// auth fields:

// action.accountID
// action.accountSession
// action.accountKey

// doc fields:

// action.owner
// action.docID
// action.version
