import dispatch from '../dispatch';
import { remove } from 'fs-extra';
import { getTestCode } from '../authMethods/TestCode';
import { initAuth, createTestUser } from '../authTestUtils';

let sessionInfo = {};
let domain = null;

beforeEach(async () => {
  sessionInfo = await initAuth('tester');
  domain = sessionInfo.domain;
});

test('Empty doc get', async () => {
  const accountGetRequest0 = await dispatch({
    type: 'DocGet',
    domain,
    owner: 'somebody',
    docName: 'thing',
  });
  expect(accountGetRequest0).toEqual(null);
  const accountGetRequest1 = await dispatch({
    type: 'DocGet',
    owner: 'somebody',
    docName: 'thing',
    ...sessionInfo,
  });
  expect(accountGetRequest1).toEqual(null);
});

test('Doc create and get', async () => {
  await dispatch({
    type: 'DocPut',
    owner: 'tester',
    docName: 'thing0',
    ...sessionInfo,
    doc: { info: 42 },
  });

  const accountGetRequest1 = await dispatch({
    type: 'DocGet',
    owner: 'tester',
    docName: 'thing0',
    ...sessionInfo,
  });
  expect(accountGetRequest1.info).toEqual(42);
});

test('Private and public doc configuration', async () => {
  await dispatch({
    type: 'DocPut',
    owner: 'tester',
    docName: 'thing0',
    ...sessionInfo,
    doc: { info: 42 },
  });
  const accountGetRequest0 = await dispatch({
    type: 'DocGet',
    domain,
    owner: 'tester',
    docName: 'thing0',
  });
  expect(accountGetRequest0).toEqual(null);

  const accountGetRequest1 = await dispatch({
    type: 'DocGet',
    owner: 'tester',
    docName: 'thing0',
    ...sessionInfo,
  });
  expect(accountGetRequest1.info).toEqual(42);

  await dispatch({
    type: 'DocPut',
    owner: 'tester',
    docName: 'thing0',
    ...sessionInfo,
    isPublic: true,
  });
  const accountGetRequest2 = await dispatch({
    type: 'DocGet',
    domain,
    owner: 'tester',
    docName: 'thing0',
  });
  expect(accountGetRequest2.info).toEqual(42);
});

test('Doc read permission', async () => {
  const readerSession = await createTestUser(
    domain,
    'reader',
    'test2@email.com',
  );
  await dispatch({
    type: 'DocPut',
    owner: 'tester',
    docName: 'thingWithPermissions',
    ...sessionInfo,
    doc: { info: 42 },
    isPublic: false,
    permissions: [
      { account: 'other', role: 'read' },
      { account: 'great', role: 'write' },
    ],
  });
  const getBeforePermissions = await dispatch({
    type: 'DocGet',
    owner: 'tester',
    docName: 'thingWithPermissions',
    ...readerSession,
  });
  expect(getBeforePermissions).toEqual(undefined);

  await dispatch({
    type: 'DocPut',
    owner: 'tester',
    docName: 'thingWithPermissions',
    ...sessionInfo,
    permissions: [
      { account: 'other', role: 'read' },
      { account: 'reader', role: 'read' },
      { account: 'great', role: 'write' },
    ],
  });

  const accountGetRequest1 = await dispatch({
    type: 'DocGet',
    owner: 'tester',
    docName: 'thingWithPermissions',
    ...readerSession,
  });
  expect(accountGetRequest1.info).toEqual(42);
});

test('Doc write permission', async () => {
  const writerSession = await createTestUser(
    domain,
    'writer',
    'test2@email.com',
  );
  await dispatch({
    type: 'DocPut',
    owner: 'tester',
    docName: 'thingWithPermissions',
    ...sessionInfo,
    doc: { info: 42 },
    isPublic: false,
    permissions: [
      { account: 'other', role: 'read' },
      { account: 'great', role: 'write' },
    ],
  });
  try {
    await dispatch({
      type: 'DocPut',
      owner: 'tester',
      docName: 'thingWithPermissions',
      ...writerSession,
      doc: { newMeaning: 3 },
    });
  } catch (e) {
    expect(e.message).toBe('Invalid authentication');
  }

  await dispatch({
    type: 'DocPut',
    owner: 'tester',
    docName: 'thingWithPermissions',
    ...sessionInfo,
    permissions: [
      { account: 'other', role: 'read' },
      { account: 'writer', role: 'write' },
      { account: 'great', role: 'write' },
    ],
  });

  await dispatch({
    type: 'DocPut',
    owner: 'tester',
    docName: 'thingWithPermissions',
    ...writerSession,
    doc: { newMeaning: 4 },
  });

  const accountGetRequest1 = await dispatch({
    type: 'DocGet',
    owner: 'tester',
    docName: 'thingWithPermissions',
    ...sessionInfo,
  });
  expect(accountGetRequest1.info).toEqual(undefined);
  expect(accountGetRequest1.newMeaning).toEqual(4);
});
