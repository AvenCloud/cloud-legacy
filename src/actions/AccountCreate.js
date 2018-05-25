import { welcomeEmail } from '../email';
// import { get, set } from '../data';
// import { checksum } from '../utils';

export const schema = {
  $schema: 'http://json-schema.org/draft-04/schema#',
  properties: {
    type: {
      enum: ['AccountCreate'],
    },
    user: {
      type: 'string',
    },
    email: {
      type: 'string',
      format: 'email',
      minLength: 5,
      maxLength: 160,
    },
    password: {
      type: 'string',
      minLength: 5,
      maxLength: 160,
    },
  },
  required: ['type', 'user', 'email', 'password'],
  additionalProperties: false,
};

export default async function AccountCreate(action) {
  await welcomeEmail({
    email: action.email,
    code: '123',
  });
  return { ok: 'cool' };
}
