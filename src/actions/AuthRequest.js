import { object, string } from 'yup';
import { authRequest } from '../auth';

export const schema = object()
  .noUnknown()
  .shape({
    type: string().oneOf(['AuthRequest']),
    authMethod: string().oneOf(['TestCode']),
    authInfo: object(),
    domain: string().notRequired(),
  });

export default async function AuthRequest(action) {
  const { authChallenge } = await authRequest(
    action.domain,
    action.authMethod,
    action.authInfo,
  );

  return {
    authMethod: action.authMethod,
    authChallenge,
  };
}
