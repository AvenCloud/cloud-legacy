import express from 'express';
import { json } from 'body-parser';
import ReactDOMServer from 'react-dom/server';
import { AppRegistry } from 'react-native';
import dispatch from './dispatch';
import App from './App';
import { handleServerRequest } from '@react-navigation/web';
import startWSServer from './startWSServer';
import http from 'http';
import { config } from './config';

const yes = require('yes-https');
const helmet = require('helmet');
const WebSocket = require('ws');

const assets =
  process.env.RAZZLE_ASSETS_MANIFEST &&
  require(process.env.RAZZLE_ASSETS_MANIFEST);
const jsClientURL = assets ? assets.client.js : '';
const staticDir = config.CLOUD_APP_PUBLIC_DIR || process.env.RAZZLE_PUBLIC_DIR;

export default async function startServer(inputConfig) {
  const server = express();

  server.use(helmet());
  server.use(yes());
  if (staticDir) {
    server.use(express.static(staticDir));
  }

  AppRegistry.registerComponent('App', () => App);

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

  server.get('/*', (req, res) => {
    const { path, query } = req;

    const { navigation, title } = handleServerRequest(App.router, path, query);
    // const { navigation, title } = { navigation: undefined, title: 'Aven Cloud' };

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
        }
        </style>
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
  };

  return {
    remove,
  };
}
