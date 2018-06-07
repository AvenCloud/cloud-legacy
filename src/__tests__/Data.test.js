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

test('putObject returns a consistent checksum', async () => {
  const testObj0 = { foo: 'bar' };
  const testObj1 = { foo: 'bar' };
  const testObjDifferent = { foo: 'baz' };

  const eTag0 = await putObject('test0', testObj0);
  const eTag1 = await putObject('test0', testObj1);
  const eTag2 = await putObject('test0', testObjDifferent);

  expect(eTag0).not.toBeFalsy();
  expect(eTag1).not.toBeFalsy();
  expect(eTag2).not.toBeFalsy();
  expect(eTag0).toEqual(eTag1);
  expect(eTag0).not.toEqual(eTag2);
});

test('Unknown getObject results in null', async () => {
  const result = await getObject(uuid());
  expect(result).toBe(null);
});
