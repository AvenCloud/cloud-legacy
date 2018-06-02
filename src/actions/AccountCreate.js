import { getAccount, putAccount, putAuth, putSession } from '../data';
import { uuid, hashSecureString } from '../utils';
import { authVerify, PRIMARY_DOMAIN } from '../auth';
import { isAuthName, authVerificationAction } from '../commonSchema';
import { object, string } from 'yup';

export const schema = object()
  .noUnknown()
  .shape({
    type: string().oneOf(['AccountCreate']),
    domain: string().notRequired(),
    authName: isAuthName,
    password: string().notRequired(),
    ...authVerificationAction,
  });

export default async function AccountCreate(action) {
  const { authName } = action;
  const domain = action.domain || PRIMARY_DOMAIN;
  const authData = await authVerify(action);
  const { authID } = authData;

  if (authData.authName && authData.authName !== authName) {
    throw new Error(
      'An account already exists with this authentication info. Try logging in instead.',
    );
  }
  if (await getAccount(domain, authName)) {
    throw new Error('An account already exists with this name.');
  }

  const passwordHash = action.password
    ? await hashSecureString(action.password)
    : null;

  const account = {
    primaryAuthID: authID,
    authName,
    domain,
    accountCreateTime: Date.now(),
    passwordHash,
  };

  await putAccount(domain, authName, account);

  try {
    await putAuth(domain, authID, {
      ...authData,
      authName,
    });
  } catch (e) {
    await putAccount(domain, authName, null);
    throw e;
  }

  try {
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
  } catch (e) {
    return { authName, authSession: null, authKey: null };
  }
}
