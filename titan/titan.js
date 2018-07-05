const express = require('express');

const phoneService = require('../phone.service/phone.service');
const emailService = require('../email.service/email.service');
const webService = require('../web.service/web.service');
const alertService = require('../alert.service/alert.service');
const monitorService = require('../monitor.service/monitor.service');
const dbService = require('../db.service/db.service');

const PORT = 8888;

require('dotenv').config();

const startTitan = async () => {
  const phone = await await phoneService.startService({
    plivoAuthId: process.env.PLIVO_AUTH_ID,
    plivoAuthToken: process.env.PLIVO_AUTH_TOKEN,
    defaultFromNumber: process.env.PLIVO_FROM_NUMBER,
  });
  const email = await await emailService.startService({
    sendgridKey: process.env.SENDGRID_KEY,
    defaultFromEmail: process.env.DEFAULT_FROM_EMAIL,
  });

  const alert = await alertService.startService({
    phone,
    email,
    alertPhone: process.env.ALERT_NUMBER,
    alertEmail: process.env.ALERT_EMAIL,
  });

  // const monitor = await monitorService.startService({
  //   alert,
  //   monitorHost: 'hyperion.aven.cloud',
  // });

  const db = await dbService.startService({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DB,
    password: process.env.PG_PASS,
    port: process.env.PG_PORT,
    ssl: true,
  });

  const web = await webService.startService({
    port: PORT,
    services: [alert, email, phone, monitor, db],
  });
};

startTitan()
  .then(() => {
    console.log(`server started on ${PORT}`);
  })
  .catch(console.error);
