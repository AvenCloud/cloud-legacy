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

test.skip('Versioned doc get', async () => {
  const put0 = await dispatch({
    type: 'DocPut',
    owner: 'tester',
    docName: 'thing0',
    ...sessionInfo,
    doc: { info: 42 },
  });
  const put1 = await dispatch({
    type: 'DocPut',
    owner: 'tester',
    docName: 'thing0',
    ...sessionInfo,
    doc: { info: 999 },
  });
  const get0 = await dispatch({
    type: 'DocGet',
    domain,
    owner: 'tester',
    docName: 'thing0',
    docId: put0.docId,
  });
  expect(get0.doc.info).toEqual(42);
  const get1 = await dispatch({
    type: 'DocGet',
    domain,
    owner: 'tester',
    docName: 'thing0',
    docId: put1.docId,
  });
  expect(get1.doc.info).toEqual(999);
});

test.skip('Doc history get', async () => {
  await dispatch({
    type: 'DocPut',
    owner: 'tester',
    docName: 'thing',
    ...sessionInfo,
    doc: { info: 999 },
  });
  await dispatch({
    type: 'DocPut',
    owner: 'tester',
    docName: 'thing',
    ...sessionInfo,
    doc: { info: 42 },
  });
  const history = await dispatch({
    type: 'DocHistoryGet',
    owner: 'tester',
    docName: 'thing',
    ...sessionInfo,
  });
  expect(history.versions.length).toEqual(2);
  expect(history.isAllVersions).toEqual(true);
});
