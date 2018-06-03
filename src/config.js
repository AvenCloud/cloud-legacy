const dotenv = require('dotenv');
const { readFileSync } = require('fs');
const { join } = require('path');

try {
  const envConfig = dotenv.parse(readFileSync(join(process.cwd(), '.env')));
  for (var k in envConfig) {
    process.env[k] = envConfig[k];
  }
} catch (e) {}

export const useTestClient = process.env.NODE_ENV === 'test'; // todo, test both clients

export const config = {
  ...envConfig,
  ...process.env,
};
