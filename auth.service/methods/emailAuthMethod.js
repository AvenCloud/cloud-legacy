import { checksum, genAuthCode } from '../../src/utils';
import { object, string } from 'yup';

const VERIFICATION_TIMEOUT_HOURS = 2;

const SITE_NAME = 'Aven';

const registerTemplate = params => ({
  subject: `Welcome to ${SITE_NAME}! Your auth code: ${
    params.verificationCode
  }`,
  message: `Your registration code is: ${params.verificationCode}
  
See you inside shortly!`,
});
const loginTemplate = params => ({
  subject: `Log in to ${SITE_NAME} with code: ${params.verificationCode}`,
  message: `Your login code is: ${params.verificationCode}
  
See you inside shortly!`,
});
const lostPassTemplate = params => ({
  subject: `Reset your ${SITE_NAME} password. Verification code: ${
    params.verificationCode
  }`,
  message: `A password reset was requested for your ${SITE_NAME} password on ${
    process.env.CLOUD_PRIMARY_HOST
  }

Your verification code is: ${params.verificationCode}

Kindly,
${SITE_NAME} support`,
});
const genericTemplate = params => ({
  subject: `Authenticate to ${SITE_NAME}. Code: ${params.verificationCode}`,
  message: `Your account verification code is: ${params.verificationCode}
  
  Kindly,
  ${SITE_NAME} support`,
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
export default function emailAuthMethod({ email }) {
  const authInfoSchema = object()
    .noUnknown()
    .shape({
      email: string().email(),
    });

  function getAuthRef(authInfo) {
    return `__auth-email-${checksum(authInfo.email)}`;
  }

  async function request(authRef, authInfo, lastAuthData) {
    const to = authInfo.email;

    if (
      lastAuthData &&
      lastAuthData.verificationRequestTime &&
      lastAuthData.verificationRequestTime +
        1000 * 60 * 60 * VERIFICATION_TIMEOUT_HOURS >
        Date.now()
    ) {
      throw new Error('Email is already being verified!');
    }

    const verificationCode = await genAuthCode();

    const emailTemplate = getTemplate(authInfo.context);
    await email.actions.sendEmail({
      to,
      ...emailTemplate({ verificationCode }),
    });

    return {
      ...lastAuthData,
      authRef,
      verificationCode,
      verificationRequestTime: Date.now(),
      authChallenge: {
        email: to,
      },
    };
  }

  async function verify(authData, authResponse) {
    if (
      !authData ||
      !authResponse ||
      authData.verificationCode !== authResponse.verificationCode
    ) {
      throw new Error('Invalid email verification. Please try again.');
    }
    // check expiration time against authData.verificationRequestTime
    if (
      authData.verificationRequestTime +
        1000 * 60 * 60 * VERIFICATION_TIMEOUT_HOURS <
      Date.now()
    ) {
      throw new Error('Invalid email verification. Please try again.');
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
