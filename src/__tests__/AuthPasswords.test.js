import dispatch from '../dispatch';
import { remove } from 'fs-extra';
import { getTestCode } from '../authMethods/TestCode';
import { initAuth } from '../authTestUtils';

let sessionInfo = {};

beforeEach(async () => {
  sessionInfo = await initAuth('tester');
});

test('Account create and login with password', async () => {
  const authRequest = await dispatch({
    type: 'AuthRequest',
    authMethod: 'TestCode',
    authInfo: {
      email: 'test2@email.com',
    },
  });
  const testCode = getTestCode('test2@email.com');
  expect(typeof testCode).toBe('string');

  await dispatch({
    type: 'AccountCreate',
    authName: 'tester2',
    password: 'mysecret',
    authMethod: authRequest.authMethod,
    authInfo: {
      email: 'test2@email.com',
    },
    authResponse: {
      verificationCode: testCode,
    },
  });

  const session = await dispatch({
    type: 'SessionCreate',
    authName: 'tester2',
    authMethod: 'Password',
    authInfo: {
      password: 'mysecret',
    },
    authResponse: {
      // one day, a 2fac flow..
    },
  });

  expect(typeof session.authSession).toBe('string');
  expect(typeof session.authKey).toBe('string');

  const accountGetRequest = await dispatch({
    type: 'AccountGet',
    name: 'tester2',
    authName: 'tester2',
    authSession: session.authSession,
    authKey: session.authKey,
  });
  expect(accountGetRequest.authName).toBe('tester2');
  expect(accountGetRequest.isAuthenticated).toBe(true);
});
