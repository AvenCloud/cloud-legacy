const uuid = require('uuid/v1');

const startService = ({ sendgridKey, defaultFromEmail, name }) => {
  name = name || `email-${uuid()}`;

  const sg = require('@sendgrid/mail');

  sg.setApiKey(sendgridKey);

  const actions = {
    sendEmail: async ({ to, subject, message, from, fromName }) => {
      const finalFromEmail = from ? `${fromName} <${from}>` : defaultFromEmail;

      await sg.send({
        to,
        from: finalFromEmail,
        subject,
        text: message,
        // html: '<strong>coming soon</strong>',
      });
    },
  };

  return { actions, remove: () => {}, name };
};

module.exports = { startService };
