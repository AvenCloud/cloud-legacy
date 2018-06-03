import { checksum, genAuthCode } from '../utils';
import { welcomeEmail } from '../email';
import { object, string } from 'yup';

export const requestInfoSchema = object()
  .noUnknown()
  .shape({
    email: string().email(),
  });

export function getID(requestInfo) {
  return `email-${checksum(requestInfo.email)}`;
}

export async function request(authID, authInfo, lastAuthData) {
  const { email } = authInfo;

  // check if lastAuthData already has a pending verification out on it, with verificationRequestTime

  const code = await genAuthCode();

  await welcomeEmail({
    email,
    code: verificationCode,
  });

  return {
    ...lastAuthData,
    authID,
    verificationCode,
    verificationRequestTime: Date.now(),
    authChallenge: {
      email,
    },
  };
}

export async function verify(authData, authResponse) {
  if (
    !authData ||
    !authResponse ||
    authData.verificationCode !== authResponse.verificationCode
  ) {
    return { authID: null, authName: null };
  }
  // check expiration time against authData.verificationRequestTime
  return authData;
}
