import pubsub from '../pubsub';

export const schema = {
  $schema: 'http://json-schema.org/draft-04/schema#',
  properties: {
    type: {
      enum: ['SessionDestroy'],
    },
    session: {
      type: 'string',
    },
  },
  required: ['session'],
  additionalProperties: false,
};

export default async function SessionDestroy(action) {
  const message = Buffer.from(JSON.stringify({ session: action.session }));

  pubsub
    .topic('session-destroy')
    .publisher()
    .publish(message);

  return { ok: 'great' };
}
