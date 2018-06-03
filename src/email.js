import { config } from './config';

const client = require('@sendgrid/mail');

client.setApiKey(config.SENDGRID_KEY);

async function send(recipient, subject, bodyText) {
  await client.send({
    to: recipient,
    from: config.AUTH_FROM_EMAIL,
    subject,
    text: bodyText,
    // html: '<strong>and easy to do anywhere, even with Node.js</strong>',
  });
}

export async function welcomeEmail(input) {
  await send(
    input.email,
    'Welcome to Aven Cloud',
    `
To finalize registration, please use the following link:

${config.PRIMARY_HOST}/verify/${input.code}
  `,
  );
}
