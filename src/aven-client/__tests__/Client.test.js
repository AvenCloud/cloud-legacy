import Server from '../../server';
import Aven from '../Aven';
import { getTestCode } from '../../authMethods/TestCode';
import uuid from 'uuid/v1';

let server = null;
let domain = null;

beforeEach(async () => {
  server = await Server({ PORT: 8989 });
  domain = uuid();
});

afterEach(async () => {
  await server.remove();
  server = null;
});

test('client has auth behavior', async () => {
  const onCookieData = jest.fn();

  const a = new Aven({
    host: 'localhost:8989',
    disableHTTPS: true,
    domain,
    cookieData: null,
    onCookieData,
  });
  expect(a.state.isAuthenticated).toEqual(false);
  expect(a.state.authName).toEqual(null);

  await a.authRequest('TestCode', {
    email: 'zoom@email.com',
  });

  expect(onCookieData.mock.calls.length).toEqual(2);
  expect(onCookieData.mock.calls[1][0].authRequestInfo).toEqual({
    email: 'zoom@email.com',
  });
  expect(onCookieData.mock.calls[1][0].authRequestMethod).toEqual('TestCode');

  const testCode = getTestCode('zoom@email.com');
  expect(typeof testCode).toBe('string');
  expect(a.state.authRequestMethod).toEqual('TestCode');
  expect(a.state.authRequestInfo.email).toEqual('zoom@email.com');

  await a.accountCreate({
    authName: 'tester',
    authResponse: {
      verificationCode: testCode,
    },
  });

  expect(a.state.authRequestMethod).toEqual(null);
  expect(a.state.authName).toEqual('tester');
  expect(a.state.isAuthenticated).toEqual(true);
  expect(typeof a.state.authKey).toEqual('string');
  expect(typeof a.state.authSession).toEqual('string');

  const account = await a.dispatchWithSession({
    type: 'AccountGet',
    name: 'tester',
  });
  expect(account.isAuthenticated).toEqual(true);
  expect(account.authName).toEqual('tester');

  const cookieState =
    onCookieData.mock.calls[onCookieData.mock.calls.length - 1][0];
  expect(cookieState.authName).toEqual('tester');
  expect(typeof cookieState.authKey).toEqual('string');
  expect(typeof cookieState.authSession).toEqual('string');

  const a1 = new Aven({
    host: 'localhost:8989',
    disableHTTPS: true,
    domain,
    cookieData: cookieState,
    onCookieData: () => {},
  });

  const accountB = await a1.dispatchWithSession({
    type: 'AccountGet',
    name: 'tester',
  });
  expect(accountB.isAuthenticated).toEqual(true);
  expect(accountB.authName).toEqual('tester');
});
