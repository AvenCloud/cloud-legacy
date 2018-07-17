const uuid = require('uuid/v1');

const startService = ({ phone, email, alertPhone, alertEmail, name }) => {
  name = name || `alert-${uuid()}`;

  const actions = {
    alert: async ({ message }) => {
      await phone.actions.sendSms({
        to: alertPhone,
        message: 'Aven Alert: ' + message,
      });
      await email.actions.sendEmail({
        to: alertEmail,
        subject: message,
        message: 'Aven Alert: ' + message,
      });
    },
  };

  return { actions, remove: () => {}, name };
};

module.exports = { startService };
