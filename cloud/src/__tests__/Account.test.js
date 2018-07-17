import dispatch from '../dispatch';
import { remove } from 'fs-extra';
import { getTestCode } from '../authMethods/TestCode';
import { initAuth } from '../authTestUtils';
import uuid from 'uuid/v1';

let sessionInfo = {};
let domain = null;

beforeEach(async () => {
  domain = uuid();
  sessionInfo = await initAuth(domain, 'tester');
});

test('Empty account get', async () => {
  const accountGetRequest0 = await dispatch({
    type: 'AccountGet',
    domain,
    name: 'nobody',
  });
  expect(accountGetRequest0).toEqual(null);
  const accountGetRequest1 = await dispatch({
    type: 'AccountGet',
    name: 'nobody2',
    ...sessionInfo,
  });
  expect(accountGetRequest1).toEqual(null);
});

test('My account get', async () => {
  const accountGetRequest = await dispatch({
    type: 'AccountGet',
    name: 'tester',
    ...sessionInfo,
  });
  expect(accountGetRequest.authName).toBe('tester');
  expect(accountGetRequest.isAuthenticated).toBe(true);
});

test('Unauthenticated account get', async () => {
  const accountGetRequest = await dispatch({
    type: 'AccountGet',
    name: 'tester',
    domain,
  });
  expect(accountGetRequest).toEqual({
    authName: 'tester',
    isAuthenticated: false,
    publicInfo: undefined,
  });
});

test('My account set', async () => {
  await dispatch({
    type: 'AccountPut',
    ...sessionInfo,
    publicInfo: { foo: 'bar' },
    privateInfo: { secret: 'stuff' },
  });

  const accountGetRequest = await dispatch({
    type: 'AccountGet',
    name: 'tester',
    ...sessionInfo,
  });
  expect(accountGetRequest.authName).toBe('tester');
  expect(accountGetRequest.isAuthenticated).toBe(true);
  expect(accountGetRequest.publicInfo.foo).toBe('bar');
  expect(accountGetRequest.privateInfo.secret).toBe('stuff');

  const publicAccountGetRequest = await dispatch({
    type: 'AccountGet',
    domain,
    name: 'tester',
  });
  expect(publicAccountGetRequest.authName).toBe('tester');
  expect(publicAccountGetRequest.isAuthenticated).toBe(false);
  expect(publicAccountGetRequest.publicInfo.foo).toBe('bar');
  expect(publicAccountGetRequest.privateInfo).toBe(undefined);
});
