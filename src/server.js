import express from 'express';
import { json } from 'body-parser';
import ReactDOMServer from 'react-dom/server';
import { AppRegistry } from 'react-native';
import dispatch from './dispatch';
import App from './App';

const assets = require(process.env.RAZZLE_ASSETS_MANIFEST);

const server = express();

AppRegistry.registerComponent('App', () => App);

server
  .disable('x-powered-by')
  .use(express.static(process.env.RAZZLE_PUBLIC_DIR));

server.post('/api', json(), async (req, res) => {
  try {
    const result = await dispatch(req.body);
    res.send(JSON.stringify(result));
  } catch (e) {
    res.status(400).send(e);
  }
});

server.get('/*', (req, res) => {
  const { path, query } = req;

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
