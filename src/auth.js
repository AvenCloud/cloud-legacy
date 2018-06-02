import { getAuth, putAuth, getSession, getAccount } from './data';
import { compareSecureString } from './utils';

const methods = {
  TestCode: require('./authMethods/TestCode'),
  // EmailCode: require('./authMethods/EmailCode'),
  // SMSCode: require('./authMethods/SMSCode'),
};

export function getMethod(methodName) {
  if (methods[methodName]) {
    return methods[methodName];
  }
  throw new Error({
    message: `Auth method "${methodName}" is not supported`,
    path: 'authMethod',
  });
}

export const PRIMARY_DOMAIN = process.env.CLOUD_PRIMARY_HOST || 'root';

export async function authRequest(domain, authMethod, authInfo) {
  if (authMethod === 'Password') {
    return { authChallenge: null };
  }
  const AuthMethod = getMethod(authMethod);
  const authID = AuthMethod.getID(authInfo);
  const authData = await getAuth(domain || PRIMARY_DOMAIN, authID);
  // should probably implement rate limiting for repeated reset attempts of the same authID
  const newAuthData = await AuthMethod.request(authID, authInfo, authData);
  await putAuth(domain, authID, newAuthData);
  const { authChallenge } = newAuthData;
  return { authChallenge };
}

export async function authVerify(action) {
  const { domain, authMethod, authInfo, authResponse, authName } = action;
  if (authMethod === 'Password') {
    const account = await getAccount(domain || PRIMARY_DOMAIN, authName);
    if (!account.passwordHash) {
      return { authName: null, authID: null };
    }
    if (
      await compareSecureString(action.authInfo.password, account.passwordHash)
    ) {
      return { authName, authID: 'password' };
    }
    return { authName: null, authID: null };
  }
  const AuthMethod = getMethod(authMethod);
  const authID = AuthMethod.getID(authInfo);
  const authData = await getAuth(domain || PRIMARY_DOMAIN, authID);
  return await AuthMethod.verify(authData, authResponse);
}

const NO_AUTH = { authName: null };

export async function verifySessionAuth(action) {
  const { domain, authName, authSession, authKey } = action;
  const session = await getSession(domain || PRIMARY_DOMAIN, authSession);
  if (!session) {
    return NO_AUTH;
  }
  if (session.authKey !== authKey) {
    return NO_AUTH;
  }
  if (session.authName !== authName) {
    return NO_AUTH;
  }
  return { authName };
}
