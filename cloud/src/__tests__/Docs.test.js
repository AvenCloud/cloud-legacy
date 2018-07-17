import dispatch from '../dispatch';
import { remove } from 'fs-extra';
import { getTestCode } from '../authMethods/TestCode';
import { initAuth, createTestUser } from '../authTestUtils';
import uuid from 'uuid/v1';

let domain = null;
let sessionInfo = {};

beforeEach(async () => {
  domain = uuid();
  sessionInfo = await initAuth(domain, 'tester');
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
  expect(accountGetRequest1.doc.info).toEqual(42);
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
  expect(accountGetRequest1.doc.info).toEqual(42);
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
  expect(accountGetRequest2.doc.info).toEqual(42);
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
      { authName: 'other', role: 'read' },
      { authName: 'great', role: 'write' },
    ],
  });
  const getBeforePermissions = await dispatch({
    type: 'DocGet',
    owner: 'tester',
    docName: 'thingWithPermissions',
    ...readerSession,
  });
  expect(getBeforePermissions).toEqual(null);
  await dispatch({
    type: 'DocPut',
    owner: 'tester',
    docName: 'thingWithPermissions',
    ...sessionInfo,
    permissions: [
      { authName: 'other', role: 'read' },
      { authName: 'reader', role: 'read' },
      { authName: 'great', role: 'write' },
    ],
  });
  const accountGetRequest1 = await dispatch({
    type: 'DocGet',
    owner: 'tester',
    docName: 'thingWithPermissions',
    ...readerSession,
  });
  expect(accountGetRequest1.doc.info).toEqual(42);
});

test('Doc write permission', async () => {
  const writerSession = await createTestUser(
    domain,
    'writer',
    'test2@email.com',
  );
  const firstPut = await dispatch({
    type: 'DocPut',
    owner: 'tester',
    docName: 'thingWithPermissions',
    ...sessionInfo,
    doc: { info: 42 },
    isPublic: false,
    permissions: [
      { authName: 'other', role: 'read' },
      { authName: 'great', role: 'write' },
    ],
  });
  expect(typeof firstPut.docId).toBe('string');
  try {
    await dispatch({
      type: 'DocPut',
      owner: 'tester',
      lastDocId: firstPut.docId,
      docName: 'thingWithPermissions',
      ...writerSession,
      doc: { newMeaning: 3 },
    });
  } catch (e) {
    expect(e.message).toBe('Invalid Authentication');
  }
  await dispatch({
    type: 'DocPut',
    owner: 'tester',
    docName: 'thingWithPermissions',
    ...sessionInfo,
    lastDocId: firstPut.docId,
    permissions: [
      { authName: 'other', role: 'read' },
      { authName: 'writer', role: 'write' },
      { authName: 'great', role: 'write' },
    ],
  });
  const put2 = await dispatch({
    type: 'DocPut',
    owner: 'tester',
    docName: 'thingWithPermissions',
    lastDocId: firstPut.docId,
    ...writerSession,
    doc: { newMeaning: 4 },
  });
  const accountGetRequest1 = await dispatch({
    type: 'DocGet',
    owner: 'tester',
    docName: 'thingWithPermissions',
    ...sessionInfo,
  });
  expect(accountGetRequest1.doc.newMeaning).toEqual(4);
});
