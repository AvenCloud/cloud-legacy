import { putSession } from '../data';
import { PRIMARY_DOMAIN } from '../auth';
import { isAuthSession } from '../commonSchema';
import { object, string } from 'yup';

export const schema = object()
  .noUnknown()
  .shape({
    type: string().oneOf(['SessionDestroy']),
    domain: string().notRequired(),
    authSession: isAuthSession,
  });

export default async function SessionDestroy(action) {
  const { authSession } = action;

  const domain = action.domain || PRIMARY_DOMAIN;

  await putSession(domain, action.authSession, undefined);
}
