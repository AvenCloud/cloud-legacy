import { object, string } from 'yup';
import { getDocVersion, getDocMeta } from '../data';
import { getPermissions } from '../permission';
import { PRIMARY_DOMAIN, verifySessionAuth } from '../auth';
import {
  optionallyAuthenticatedAction,
  isAuthName,
  isDocName,
} from '../commonSchema';

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

  const docMeta = await getDocMeta(
    action.domain || PRIMARY_DOMAIN,
    action.owner,
    action.docName,
  );
  if (!docMeta) {
    return null;
  }
  const { canRead } = getPermissions(docMeta, authName);
  if (canRead) {
    const doc = await getDocVersion(action.domain, docMeta.docId);
    if (doc) {
      return {
        ...docMeta,
        doc,
      };
    }
  }
  return null;
}
