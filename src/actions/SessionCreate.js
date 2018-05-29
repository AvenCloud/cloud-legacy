import { welcomeEmail } from '../email';
import { getAccount, putAccount, putAuth, putSession } from '../data';
import { uuid } from '../utils';
import { authVerify, PRIMARY_DOMAIN } from '../auth';
import { isAuthName, authVerificationAction } from '../commonSchema';
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
    throw {
      message: 'Invalid Account!',
      path: 'authName',
    };
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
