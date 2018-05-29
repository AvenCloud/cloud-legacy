import dispatch from '../dispatch';
import { remove } from 'fs-extra';
import { getTestCode } from '../authMethods/TestCode';
import { initAuth } from '../authTestUtils';

let sessionInfo = {};

beforeEach(async () => {
  sessionInfo = await initAuth('tester');
});

test('Auth core', async () => {
  const accountGetRequest = await dispatch({
    type: 'AccountGet',
    name: 'tester',
    ...sessionInfo,
  });
  expect(accountGetRequest.authName).toBe('tester');
  expect(accountGetRequest.isAuthenticated).toBe(true);
});

test('Basic account creation flow', async () => {
  const authRequest = await dispatch({
    type: 'AuthRequest',
    authMethod: 'TestCode',
    authInfo: {
      email: 'test@email.com',
    },
  });
  const testCode = getTestCode('test@email.com');
  expect(typeof testCode).toBe('string');

  const accountCreationRequest = await dispatch({
    type: 'AccountCreate',
    authName: 'tester2',
    authMethod: authRequest.authMethod,
    authInfo: {
      email: 'test@email.com',
    },
    authResponse: {
      verificationCode: testCode,
    },
  });
  expect(typeof accountCreationRequest.authSession).toBe('string');
  expect(typeof accountCreationRequest.authKey).toBe('string');

  const accountGetRequest = await dispatch({
    type: 'AccountGet',
    name: 'tester2',
    authName: 'tester2',
    authSession: accountCreationRequest.authSession,
    authKey: accountCreationRequest.authKey,
  });
  expect(accountGetRequest.authName).toBe('tester2');
  expect(accountGetRequest.isAuthenticated).toBe(true);
});

test('logout login logout', async () => {
  const { authName, authSession, authKey, domain } = sessionInfo;

  await dispatch({
    type: 'SessionDestroy',
    domain,
    authSession,
  });

  const accountGetRequest = await dispatch({
    type: 'AccountGet',
    domain,
    name: 'tester',
    authName,
    authSession,
    authKey,
  });
  expect(accountGetRequest.isAuthenticated).toBe(false);

  const authRequest = await dispatch({
    type: 'AuthRequest',
    domain,
    authMethod: 'TestCode',
    authInfo: {
      email: 'test@email.com',
    },
  });
  const verificationCode = getTestCode('test@email.com');

  const newSession = await dispatch({
    type: 'SessionCreate',
    domain,
    authName,
    authMethod: 'TestCode',
    authInfo: {
      email: 'test@email.com',
    },
    authResponse: {
      verificationCode,
    },
  });

  const accountGet2Request = await dispatch({
    type: 'AccountGet',
    domain,
    name: 'tester',
    authName,
    authSession: newSession.authSession,
    authKey: newSession.authKey,
  });
  expect(accountGet2Request.isAuthenticated).toBe(true);
});
