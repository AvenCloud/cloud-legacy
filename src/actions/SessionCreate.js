import { putSession } from '../data';
import { uuid } from '../utils';
import { authVerify, PRIMARY_DOMAIN } from '../auth';
import { authVerificationAction } from '../commonSchema';
import { object, string } from 'yup';

export const schema = object()
  .noUnknown()
  .shape({
    type: string().oneOf(['SessionCreate']),
    domain: string().notRequired(),
    ...authVerificationAction,
  });

export default async function SessionCreate(action) {
  const { authName } = action;
  const domain = action.domain || PRIMARY_DOMAIN;

  const authData = await authVerify(action);
  const { authID } = authData;

  if (!authID || authData.authName !== authName) {
    throw new Error('Invalid Account!');
  }

  const authSession = uuid();
  const authKey = uuid();

  await putSession(domain, authSession, {
    authID,
    authName,
    authSession,
    authKey,
    sessionCreateTime: Date.now(),
  });

  return { authName, authSession, authKey };
}
