import { checksum, genAuthCode } from '../../src/utils';
import { object, string } from 'yup';

export default function phoneAuthMethod({ phone }) {
  const authInfoSchema = object()
    .noUnknown()
    .shape({
      phone: string(),
    });

  function getAuthRef(authInfo) {
    return `__auth-phone-${checksum(authInfo.phone)}`;
  }

  async function request(authID, authInfo, lastAuthData) {
    const { phone } = authInfo;

    // check if lastAuthData already has a pending verification out on it, with verificationRequestTime

    const verificationCode = await genAuthCode();

    await phone.actions.sendSms({
      to: phone,
      message: 'Welcome to Aven. Your auth code is ' + verificationCode,
    });

    return {
      ...lastAuthData,
      authID,
      verificationCode,
      verificationRequestTime: Date.now(),
      authChallenge: {
        phone,
      },
    };
  }

  async function verify(authData, authResponse) {
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

  return {
    authInfoSchema,
    getAuthRef,
    request,
    verify,
  };
}
