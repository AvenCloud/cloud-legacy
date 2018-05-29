import { object, string } from 'yup';
import { getAccount, putAccount } from '../data';
import { PRIMARY_DOMAIN, verifySessionAuth } from '../auth';
import { authenticatedAction } from '../commonSchema';

export const schema = object()
  .noUnknown()
  .shape({
    type: string().oneOf(['AccountPut']),
    publicInfo: object(),
    privateInfo: object(),
    ...authenticatedAction,
  });

export default async function AccountPut(action) {
  const { authName } = await verifySessionAuth(action);
  if (!authName) {
    throw {
      message: 'Invalid authentication',
    };
  }
  const lastAccount = await getAccount(
    action.domain || PRIMARY_DOMAIN,
    authName,
  );
  await putAccount(action.domain || PRIMARY_DOMAIN, authName, {
    ...lastAccount,
    publicInfo: {
      ...lastAccount.publicInfo,
      ...action.publicInfo,
    },
    privateInfo: {
      ...lastAccount.privateInfo,
      ...action.privateInfo,
    },
  });
  return { authName };
}
