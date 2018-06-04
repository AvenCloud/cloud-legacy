import { string, object } from 'yup';

export const isEmail = {
  type: 'string',
  format: 'email',
  minLength: 5,
  maxLength: 160,
};

export const isPassword = {
  type: 'string',
  minLength: 5,
  maxLength: 160,
};

export const isAuthName = string()
  .min(5)
  .max(30)
  .matches(
    /^[a-z]+[a-z0-9-]*[a-z0-9]+$/,
    'Must be lower-case alphanumeric with dashes (eg. my-gr8-name)',
  );

export const isDocName = string()
  .min(2)
  .max(64)
  .matches(
    /^[a-zA-Z]+[a-zA-Z0-9-_.]*[a-zA-Z0-9]+$/,
    'Must be alphanumeric with dashes, underscores, and dots (eg. My-gr8_Name)',
  );

export const isAuthSession = string();
export const isAuthKey = string();
export const isDomain = string();

export const isPermissionRule = object()
  .noUnknown()
  .shape({
    account: isAuthName,
    role: string().oneOf(['write', 'read']),
  });

export const authenticatedAction = {
  domain: isDomain.notRequired(),
  authName: isAuthName,
  authKey: isAuthKey,
  authSession: isAuthSession,
};
export const optionallyAuthenticatedAction = {
  // todo, make this actually different
  ...authenticatedAction,
};
export const isAuthMethod = string().oneOf([
  'TestCode',
  'EmailCode',
  'Password',
]);

export const authVerificationAction = {
  authName: isAuthName,
  authMethod: isAuthMethod,
  authInfo: object(),
  authResponse: object(),
  authChallenge: object(),
};
