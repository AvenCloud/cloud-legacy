console.log('Starter Env varaibles: ' + JSON.stringify(process.env));

const dotenv = require('dotenv');
const { readFileSync } = require('fs');
const { join } = require('path');

let envConfig = {};
try {
  envConfig = dotenv.parse(readFileSync(join(process.cwd(), '.env')));
  for (var k in envConfig) {
    process.env[k] = envConfig[k];
  }
} catch (e) {}

const isTestEnv = process.env.NODE_ENV === 'test';

export const useTestClient = isTestEnv; // todo, test both clients

const inputConfig = {
  ...envConfig,
  ...process.env,
};

export const config = {
  ...inputConfig,
  SENDGRID_KEY: isTestEnv ? null : inputConfig.SENDGRID_KEY,
  isTestEnv,
};

console.log('Final Config' + JSON.stringify(config));
