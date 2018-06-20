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

test('docs', async () => {});
