const fs = require('fs');
const nginxConf = require('./nginx.conf.js');

const pgIP = fs.readFileSync('/SETUP_PG_IP.txt', { encoding: 'utf8' });
const clusterName = fs.readFileSync('/SETUP_CLUSTER_NAME.txt', {
  encoding: 'utf8',
});
const cluster = fs.readFileSync('/SETUP_CLUSTER.json', { encoding: 'utf8' });

fs.writeFileSync(
  '/etc/nginx/nginx.conf',
  nginxConf({ clusterName, useSSL: false }),
);
