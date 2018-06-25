const plivo = require('plivo');
const uuid = require('uuid/v1');

const startService = ({
  plivoAuthId,
  plivoAuthToken,
  defaultFromNumber,
  name,
}) => {
  name = name || `phone-${uuid()}`;

  const client = new plivo.Client(plivoAuthId, plivoAuthToken);

  const actions = {
    sendSms: async ({ to, message, from }) => {
      const finalFrom = from || defaultFromNumber;

      await client.messages.create(finalFrom, to, message);
    },
  };

  return { actions, remove: () => {}, name };
};

module.exports = { startService };
