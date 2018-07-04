import { checksum, genAuthCode } from '../../src/utils';
import { object, string } from 'yup';

const VERIFICATION_TIMEOUT_HOURS = 2;
// todo, reduce copy-pasta between here and email auth method
const SITE_NAME = 'Aven';

const registerTemplate = params => ({
  message: `Welcome to ${SITE_NAME}! Verification code: ${
    params.verificationCode
  }`,
});
const loginTemplate = params => ({
  message: `Login code for ${SITE_NAME}: ${params.verificationCode}`,
});
const lostPassTemplate = params => ({
  message: `Password reset code for ${SITE_NAME}: ${params.verificationCode}`,
});

const genericTemplate = params => ({
  message: `Verification code for ${SITE_NAME}: ${params.verificationCode}`,
});

const getTemplate = context => {
  switch (context) {
    case 'register':
      return registerTemplate;
    case 'login':
      return loginTemplate;
    case 'lostPass':
      return lostPassTemplate;
    default:
      return genericTemplate;
  }
};

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
    if (
      lastAuthData &&
      lastAuthData.verificationRequestTime &&
      lastAuthData.verificationRequestTime +
        1000 * 60 * 60 * VERIFICATION_TIMEOUT_HOURS >
        Date.now()
    ) {
      throw new Error('This phone number has verification pending already.');
    }

    const verificationCode = await genAuthCode();

    const template = getTemplate(authInfo.context);

    await phone.actions.sendSms({
      to: authInfo.phone,
      ...template({ verificationCode }),
    });

    return {
      ...lastAuthData,
      authID,
      verificationCode,
      verificationRequestTime: Date.now(),
      authChallenge: {
        phone: authInfo.phone,
      },
    };
  }

  async function verify(authData, authResponse) {
    if (
      !authData ||
      !authResponse ||
      authData.verificationCode !== authResponse.verificationCode
    ) {
      throw new Error('Invalid phone verification. Please try again.');
    }
    if (
      authData.verificationRequestTime +
        1000 * 60 * 60 * VERIFICATION_TIMEOUT_HOURS <
      Date.now()
    ) {
      throw new Error('Invalid phone verification. Please try again.');
    }
    return {
      ...authData,
      verificationCode: null,
      verificationRequestTime: null,
    };
  }

  return {
    authInfoSchema,
    getAuthRef,
    request,
    verify,
  };
}
