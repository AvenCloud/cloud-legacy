import express from 'express';
import { json } from 'body-parser';
import ReactDOMServer from 'react-dom/server';
import { AppRegistry } from 'react-native';
import dispatch from './dispatch';
import App from './App';

const { config } = require('./config');
const yes = require('yes-https');
const helmet = require('helmet');

const assets = require(process.env.RAZZLE_ASSETS_MANIFEST);
const staticDir = config.CLOUD_APP_PUBLIC_DIR || process.env.RAZZLE_PUBLIC_DIR;

const server = express();
server.use(helmet());
server.use(yes());
server.use(express.static(staticDir));

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
  // const { path, query } = req;

  const { element, getStyleElement } = AppRegistry.getApplication('App', {
    initialProps: {},
  });

  const html = ReactDOMServer.renderToString(element);
  const css = ReactDOMServer.renderToStaticMarkup(getStyleElement());

  const title = 'Aven Cloud';

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
            ? `<script src="${assets.client.js}" defer></script>`
            : `<script src="${assets.client.js}" defer crossorigin></script>`
        }
    </head>
    <body>
        <div id="root">${html}</div>
    </body>
</html>`,
  );
});

export default server;
