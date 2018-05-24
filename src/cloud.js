require('babel-core/register');
require('babel-polyfill');

import { list } from './data';
import dispatch from './dispatch';
const bodyParser = require('body-parser');
const express = require('express');
const app = express();

app.get('/', async (req, res) => {
  const objs = await list();
  res.send(JSON.stringify(objs));
});

app.listen(process.env.PORT, () => {
  console.log(`App launched on ${process.env.PORT}`);
});

app.post('/api', bodyParser.json(), async (req, res) => {
  try {
    const result = await dispatch(req.body);
    res.send(JSON.stringify(result));
  } catch (e) {
    res.status(400).send(e);
  }
});
