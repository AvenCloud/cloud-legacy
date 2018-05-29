import { getObject, putObject } from '../data';
import uuid from 'uuid/v1';

test('env', () => {
  expect(process.env.NODE_ENV).toBe('test');
});

test('Data works', async () => {
  const testObj = { foo: 'bar' };
  await putObject('test0', testObj);
  const responseObj = await getObject('test0');
  expect(typeof responseObj).toBe('object');
  expect(responseObj.foo).toBe('bar');
});

test('Unknown getObject results in null', async () => {
  const result = await getObject(uuid());
  expect(result).toBe(null);
});
