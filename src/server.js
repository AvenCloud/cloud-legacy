import express from 'express';
import { json } from 'body-parser';
import ReactDOMServer from 'react-dom/server';
import { AppRegistry } from 'react-native';
import App from './App';
import { handleServerRequest } from '@react-navigation/web';
import startWSServer from './startWSServer';
import http from 'http';
import { config } from './config';
import { pageColor } from './common';

import emailAuthMethod from '../auth.service/methods/emailAuthMethod';
import phoneAuthMethod from '../auth.service/methods/phoneAuthMethod';
const emailService = require('../email.service/email.service');
const phoneService = require('../phone.service/phone.service');
const dbService = require('../db.service/db.service');
const authService = require('../auth.service/auth.service');

const yesHTTPS = require('yes-https');
const helmet = require('helmet');
const WebSocket = require('ws');

const assets =
  process.env.RAZZLE_ASSETS_MANIFEST &&
  require(process.env.RAZZLE_ASSETS_MANIFEST);
const jsClientURL = assets ? assets.client.js : '';
const staticDir = config.CLOUD_APP_PUBLIC_DIR || process.env.RAZZLE_PUBLIC_DIR;

export default async function startServer(inputConfig) {
  const server = express();

  // server.use(helmet());
  // server.use(yesHTTPS());
  if (staticDir) {
    server.use(express.static(staticDir));
  }

  AppRegistry.registerComponent('App', () => App);

  server.get('/*', (req, res) => {
    const { path, query } = req;

    const { navigation, title } = handleServerRequest(App.router, path, query);

    const { element, getStyleElement } = AppRegistry.getApplication('App', {
      initialProps: {
        navigation,
      },
    });

    const html = ReactDOMServer.renderToString(element);
    const css = ReactDOMServer.renderToStaticMarkup(getStyleElement());

    res.send(
      `<!doctype html>
    <html lang="">
    <head>
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta charSet='utf-8' />
        <title>${title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style id="root-stylesheet">
        html, body, #root {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          background-color: ${pageColor};
        }
        </style>
        <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.1.0/css/all.css" integrity="sha384-lKuwvrZot6UHsBSfcMvOkWwlCMgc0TaWr+30HWe3a4ltaBwTZhyTEggF5tJv8tbt" crossorigin="anonymous">

        ${css}
        ${
          process.env.NODE_ENV === 'production'
            ? `<script src="${jsClientURL}" defer></script>`
            : `<script src="${jsClientURL}" defer crossorigin></script>`
        }
    </head>
    <body>
        <div id="root">${html}</div>
    </body>
</html>`,
    );
  });

  const httpServer = http.createServer(server);
  const serverConfig = { ...config, ...inputConfig };

  const wss = new WebSocket.Server({ server: httpServer });

  const wsServer = await startWSServer(wss);

  const db = await dbService.startService({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DB,
    password: process.env.PG_PASS,
    port: process.env.PG_PORT,
    ssl: true,
  });

  const phone = await await phoneService.startService({
    plivoAuthId: process.env.PLIVO_AUTH_ID,
    plivoAuthToken: process.env.PLIVO_AUTH_TOKEN,
    defaultFromNumber: process.env.PLIVO_FROM_NUMBER,
  });
  const email = await await emailService.startService({
    sendgridKey: process.env.SENDGRID_KEY,
    defaultFromEmail: process.env.DEFAULT_FROM_EMAIL,
  });

  const auth = await authService.startService({
    db,
    authMethods: {
      email: await emailAuthMethod({
        email,
      }),
      phone: await phoneAuthMethod({
        phone,
      }),
    },
  });

  const exportActions = { ...auth.actions };

  const dispatch = async action => {
    if (exportActions[action.type]) {
      return await exportActions[action.type](action);
    }
    throw new Error(`Action "${action.type} not found!`);
  };

  server.post('/api', json(), async (req, res) => {
    try {
      const result = await dispatch(req.body);
      res.send(JSON.stringify(result));
    } catch (e) {
      const error = { ...e, message: e.message };
      if (!error.message) {
        console.error('Experienced API error without proper formatting!', e);
      }
      res.status(400).send({ error });
    }
  });

  httpServer.listen(serverConfig.PORT, error => {
    if (error) {
      console.log(error);
      return;
    }

    console.log(
      `Started instance ${serverConfig.INSTANCE_ID} on port ${
        serverConfig.PORT
      }`,
    );
  });

  const remove = () => {
    httpServer.close();
    wsServer.close();
    db.remove();
  };

  return {
    remove,
  };
}
