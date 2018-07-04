import { checksum, hashSecureString } from '../../src/utils';
import { object, string } from 'yup';

export default function passwordAuthMethod() {
  const authInfoSchema = object()
    .noUnknown()
    .shape({});

  function getAuthRef(authInfo, authName) {
    return `__auth-password-${checksum(authName)}`;
  }

  async function request(authRef, authInfo, lastAuthData) {
    return lastAuthData;
  }

  async function verify(authData, authResponse) {
    const passwordHash = await hashSecureString(authResponse.password);
    if (authData.passwordHash !== passwordHash) {
      throw new Error('Invalid Authentication');
    }
    return authData;
  }
  return {
    authInfoSchema,
    getAuthRef,
    request,
    verify,
  };
}
