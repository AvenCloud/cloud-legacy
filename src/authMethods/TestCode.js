import { checksum, genAuthCode } from '../utils';
import { object, string } from 'yup';

export const requestInfoSchema = object()
  .noUnknown()
  .shape({
    email: string().email(),
  });

export function getID(requestInfo) {
  return `test-email-${checksum(requestInfo.email)}`;
}

const lastEmailedCodes = new Map();

// for testing only in this module:
export function getTestCode(email) {
  return lastEmailedCodes.get(email);
}

export async function request(authID, authInfo, lastAuthData) {
  const { email } = authInfo;

  // check if lastAuthData already has a pending verification out on it

  const testCodeValue = await genAuthCode();

  lastEmailedCodes.set(email, testCodeValue);

  process.env.NODE_ENV !== 'test' &&
    console.log(`Authenticating ${email} by sending code ${testCodeValue}`);

  return {
    ...lastAuthData,
    authID,
    testCodeValue,
    testCodeRequestTime: Date.now(),
    authChallenge: {
      email,
    },
  };
}

export async function verify(authData, authResponse) {
  if (
    !authData ||
    !authResponse ||
    authData.testCodeValue !== authResponse.verificationCode
  ) {
    return { authID: null, authName: null };
  }
  // check expiration time against authData.testCodeRequestTime
  return authData;
}
