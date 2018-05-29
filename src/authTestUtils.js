import dispatch from './dispatch';
import { remove } from 'fs-extra';
import { getTestCode } from './authMethods/TestCode';
import uuid from 'uuid/v1';

export async function createTestUser(domain, authName, email) {
  const authInfo = { email };
  const authRequest = await dispatch({
    type: 'AuthRequest',
    domain,
    authMethod: 'TestCode',
    authInfo,
  });
  const verificationCode = getTestCode(authInfo.email);
  const { authSession, authKey } = await dispatch({
    type: 'AccountCreate',
    domain,
    authName,
    authMethod: authRequest.authMethod,
    authInfo,
    authResponse: {
      verificationCode,
    },
  });
  return { authName, authSession, authKey, domain };
}

export async function initAuth(username) {
  await remove('./test-data');
  const domain = `test-domain-${uuid()}`;
  const authName = username || 'tester';
  const email = `test@email.com`;
  return createTestUser(domain, authName, email);
}
