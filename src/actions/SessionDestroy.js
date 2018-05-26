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

console.log('launching pubsub ' + process.env.GOOGLE_APPLICATION_CREDENTIALS);

const { publish } = pubsub.topic('session-destroy').publisher();

export default async function SessionDestroy(action) {
  const message = Buffer.from(JSON.stringify({ session: action.session }));

  publish(message);

  return { ok: 'great' };
}
