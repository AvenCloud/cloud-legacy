import { object, string } from 'yup';
import { getAccount } from '../data';
import { PRIMARY_DOMAIN, verifySessionAuth } from '../auth';
import { optionallyAuthenticatedAction } from '../commonSchema';

export const schema = object()
  .noUnknown()
  .shape({
    type: string().oneOf(['AccountGet']),
    name: string(),
    ...optionallyAuthenticatedAction,
  });

export default async function AccountGet(action) {
  const account = await getAccount(
    action.domain || PRIMARY_DOMAIN,
    action.name,
  );
  if (!account) {
    return null;
  }
  const publicAccount = {
    authName: action.name,
    publicInfo: account.publicInfo,
  };
  const session = await verifySessionAuth(action);
  const { authName } = session;
  const isAuthenticated = !!authName && authName === action.name;
  if (isAuthenticated) {
    return {
      ...publicAccount,
      privateInfo: account.privateInfo,
      isAuthenticated,
    };
  }
  return {
    ...publicAccount,
    isAuthenticated,
  };
}
