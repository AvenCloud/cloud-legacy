const exec = require('child_process').execFileSync;

const goDeploy = async () => {
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

  console.log('run terraform');

  exec(
    'ssh',
    ['root@hyperion.aven.cloud', '-t', 'cd /cloud && node hyperion/terra'],
    {
      stdio: 'inherit',
    },
  );

  console.log('doing node build - clone');

  exec(
    'rsync',
    ['-r', '--exclude', 'node_modules', '/cloud', '/cloud-data/build/'],
    {
      stdio: 'inherit',
    },
  );
  console.log('doing node build - yarn');
  exec('yarn', [], {
    stdio: 'inherit',
    cwd: '/cloud-data/build',
  });
  console.log('doing node build - yarn build');
  exec('yarn', ['build'], {
    stdio: 'inherit',
    cwd: '/cloud-data/build',
  });
  console.log('doing node build - tar');

  exec('tar', ['-zcf', '/cloud-data/build.tar.gz', '/cloud-data/build'], {
    stdio: 'inherit',
    cwd: '/',
  });

  console.log('doing node build - env file');
  console.log('doing node build - dist tarball');
  console.log('doing node build - reboot servers');

  console.log('deploy complete!');
};

module.exports = { goDeploy };
