require('dotenv').config();

const bodyParser = require('body-parser');
const express = require('express');
const crypto = require('crypto');
const { goDeploy } = require('./deploy');

const app = express();

app.get('/', (req, res) => {
  res.send('Hello there, public world');
});

app.post('/kick', async (req, res) => {
  if (req.query.secret !== process.env.TITAN_CLOUDUPDATE_SECRET) {
    res.setStatus(400).send('Incorrect secret');
    return;
  }
  await goDeploy();
  res.send('done');
});

app.post(
  '/update',
  bodyParser.json({
    verify: (req, res, buf, encoding) => {
      const secretDigest = crypto.createHmac(
        'sha1',
        process.env.GH_HOOK_SECRET,
      );
      secretDigest.update(buf);
      const secretSig = secretDigest.digest('hex');
      const inputSecret = req.headers['x-hub-signature'];
      if (inputSecret !== 'sha1=' + secretSig) {
        throw new Error('Invalid secret checksum');
      }
    },
  }),
  async (req, res) => {
    console.log('update from github');
    console.log(req.body);

    await goDeploy();

    res.send('thanks github');
  },
);

app.listen(8899, () => {
  console.log('server started on 8899');
});
