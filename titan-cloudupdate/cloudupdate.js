const exec = require('child_process').execFileSync;

require('dotenv').config();

const bodyParser = require('body-parser');
const express = require('express');
const crypto = require('crypto');

const app = express();

app.get('/', (req, res) => {
  res.send('Hello there, public world');
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
  (req, res) => {
    console.log('update from github');
    console.log(req.body);
    const result = exec('git', ['pull']);
    console.log('git pull', result.toString());
    const result2 = exec('yarn');
    console.log('yarn', result2.toString());
    const resultBuild = exec('yarn', ['build']);
    console.log('yarn build', resultBuild.toString());
    const result3 = exec('sudo', ['/bin/systemctl', 'restart', 'titan']);
    console.log('restart titan', result3.toString());

    const rsync = exec('rsync', [
      '.',
      'root@hyperion.aven.cloud:/cloud',
      '-r',
      '--exclude',
      'node_modules',
      '--delete-after',
    ]);
    console.log('sync code to hyperion', rsync.toString());

    const rsyncConfig = exec('rsync', [
      '.env.hyperion',
      'root@hyperion.aven.cloud:/cloud/.env',
    ]);
    console.log('sync config to hyperion', rsyncConfig.toString());

    const rsyncNginxConf = exec('rsync', [
      'titan-cloudupdate/hyperion.nginx.conf',
      'root@hyperion.aven.cloud:/etc/nginx/nginx.conf',
    ]);
    console.log('sync nginx config to hyperion', rsyncNginxConf.toString());
    const nginxReload = exec('ssh', [
      'root@hyperion.aven.cloud',
      '-t',
      'nginx -s reload',
    ]);
    console.log('reload nginx conf on hyperion', nginxReload.toString());

    const remoteYarn = exec('ssh', [
      'root@hyperion.aven.cloud',
      '-t',
      'cd /cloud && yarn',
    ]);
    console.log('remote yarn', remoteYarn.toString());

    const hyperion = exec('ssh', [
      'root@hyperion.aven.cloud',
      '-t',
      'systemctl restart hyperion',
    ]);
    console.log('restart hyperion', hyperion.toString());

    const terra = exec(
      'ssh',
      ['root@hyperion.aven.cloud', '-t', 'cd /cloud && node hyperion/terra'],
      {
        stdio: 'inherit',
      },
    );

    console.log('run terraform', terra.toString());

    console.log('deploy complete!');

    res.send('thanks github');
  },
);

app.listen(8899, () => {
  console.log('server started on 8899');
});
