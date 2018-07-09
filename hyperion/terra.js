const fs = require('fs-extra');
const nginxConfig = require('./config/nginx.conf.js');
const spawn = require('@expo/spawn-async');
const { promisify } = require('util');
const { join } = require('path');
const randomBytes = promisify(require('crypto').randomBytes);
require('dotenv').config();

const readFile = fileName => fs.readFileSync(fileName, { encoding: 'utf8' });
const resolvePath = p => join(__dirname, p);

const serversPublicKey = readFile(resolvePath('hyperion.key.pub'));
const serversPrivateKey = readFile(resolvePath('hyperion.key'));

const provisionerConnection = {
  type: 'ssh',
  private_key: serversPrivateKey,
  user: 'root',
  timeout: '2m',
};
const applyArtemisClusterConfig = (lastConfig, clusterName, cluster) => ({
  ...lastConfig,
  resource: {
    ...lastConfig.resource,
    digitalocean_droplet: {
      ...lastConfig.resource.digitalocean_droplet,
      [`${clusterName}_pg`]: {
        ssh_keys: ['${digitalocean_ssh_key.ssh.id}'],
        image: '${data.digitalocean_image.artemis_pg.image}',
        region: cluster.region,
        size: cluster.pgSize,
        private_networking: true,
        name: `${clusterName}-pg`,

        provisioner: [
          {
            file: {
              content: cluster.pgPass,
              destination: '/SETUP_PG_PASS.txt',
              connection: provisionerConnection,
            },
          },
          {
            'remote-exec': {
              script: 'pg_deploy.sh',
              connection: provisionerConnection,
            },
          },
        ],
      },

      [`${clusterName}_node`]: {
        ssh_keys: ['${digitalocean_ssh_key.ssh.id}'],
        image: '${data.digitalocean_image.artemis_node.image}',
        region: cluster.region,
        size: cluster.nodeSize,
        private_networking: true,
        name: `${clusterName}-node-\${count.index}`,

        count: cluster.nodeCount.toString(),

        provisioner: [
          {
            file: {
              // we cannot pass env variables to the remote-exec setup script, so this is how we copy all the setup info to the node machine for setup
              content: JSON.stringify(cluster),
              destination: '/SETUP_CLUSTER.json',
              connection: provisionerConnection,
            },
          },
          {
            file: {
              content: clusterName,
              destination: '/SETUP_CLUSTER_NAME.txt',
              connection: provisionerConnection,
            },
          },
          {
            file: {
              content: `\${digitalocean_droplet.${clusterName}_pg.ipv4_address}`,
              destination: '/SETUP_PG_IP.txt',
              connection: provisionerConnection,
            },
          },
          {
            file: {
              source: resolvePath('config'),
              destination: '/SETUP_CONFIG_FILES',
              connection: provisionerConnection,
            },
          },
          {
            'remote-exec': {
              script: 'node_deploy.sh',
              connection: provisionerConnection,
            },
          },
        ],
      },
    },
    digitalocean_loadbalancer: {
      ...lastConfig.resource.digitalocean_loadbalancer,
      [`${clusterName}_load`]: {
        name: `${clusterName}-load`,
        region: cluster.region,
        forwarding_rule: [
          {
            entry_port: 80,
            entry_protocol: 'http',
            target_port: 80,
            target_protocol: 'http',
          },
          {
            entry_port: 443,
            entry_protocol: 'https',
            target_port: 443,
            target_protocol: 'https',
            tls_passthrough: true,
          },
        ],
        healthcheck: {
          port: 22,
          protocol: 'tcp',
        },
        droplet_ids: [`\${digitalocean_droplet.${clusterName}_node.*.id}`],
      },
    },

    cloudflare_record: {
      ...lastConfig.resource.cloudflare_record,
      [`${clusterName}_record`]: {
        domain: 'aven.cloud',
        name: clusterName,
        value: `\${digitalocean_loadbalancer.${clusterName}_load.ip}`,
        type: 'A',
        ttl: 3600,
      },
    },
  },
});

const computeTfConfig = clusters => {
  let tfConfig = {
    data: {
      digitalocean_image: {
        artemis_node: {
          name: 'proto-artemis-node',
        },
        artemis_pg: {
          name: 'proto-artemis-pg',
        },
      },
    },
    provider: {
      digitalocean: {
        token: process.env.DIGITALOCEAN_TOKEN,
      },
      cloudflare: {
        email: process.env.CLOUDFLARE_EMAIL,
        token: process.env.CLOUDFLARE_TOKEN,
      },
    },
    resource: {
      digitalocean_ssh_key: {
        ssh: {
          name: 'DigitalOcean SSH Key',
          public_key: serversPublicKey,
        },
      },
    },
  };

  Object.keys(clusters).forEach(clusterName => {
    const { type } = clusters[clusterName];

    if (type !== 'artemis') {
      throw new Error('only one cluster type is supported now');
    }

    tfConfig = applyArtemisClusterConfig(
      tfConfig,
      clusterName,
      clusters[clusterName],
    );
  });

  return tfConfig;
};

async function goTerra() {
  const clusters = JSON.parse(readFile('/hyperion.clusters.json'));

  const tfConfig = computeTfConfig(clusters);

  await fs.writeFile(
    resolvePath('terra-out.tf.json'),
    JSON.stringify(tfConfig, null, 2),
  );

  await spawn(
    'terraform',
    ['apply', '-auto-approve', '-state', '/hyperion.tfstate'],
    {
      stdio: 'inherit',
      cwd: resolvePath('.'),
    },
  );

  console.log('Done terraforming');

  console.log('SSL setup time');

  const tfStateData = readFile('/hyperion.tfstate');

  const clusterData = {};
  const tfState = JSON.parse(tfStateData);
  const stateResourceNames = Object.keys(tfState.modules[0].resources);
  const getClusterData = clusterName => {
    const getTypeFromResourceName = resourceName => {
      if (
        resourceName.match(
          new RegExp('^digitalocean_droplet.' + clusterName + '_node'),
        )
      ) {
        return 'node';
      }
      if (
        resourceName.match(
          new RegExp('^digitalocean_droplet.' + clusterName + '_pg'),
        )
      ) {
        return 'pg';
      }
      if (
        resourceName.match(
          new RegExp('^digitalocean_loadbalancer.' + clusterName + '_load'),
        )
      ) {
        return 'load';
      }
      return 'unknown';
    };
    const nodes = {};
    stateResourceNames.forEach(resourceName => {
      const type = getTypeFromResourceName(resourceName);
      if (type === 'unknown') {
        return;
      }
      const r = tfState.modules[0].resources[resourceName];
      const {
        ipv4_address,
        price_hourly,
        price_monthly,
        region,
        ip, // load balancer provides ip instead of ipv4_address
      } = r.primary.attributes;
      nodes[resourceName] = {
        price_hourly,
        ipv4_address: ipv4_address || ip,
        price_monthly,
        region,
        type,
      };
    });
    return {
      nodes,
    };
  };
  const clusterNames = Object.keys(clusters);
  clusterNames.forEach(clusterName => {
    clusterData[clusterName] = {
      ...clusters[clusterName],
      ...getClusterData(clusterName),
    };
  });

  const keyDirOfDomain = domain => `/etc/letsencrypt/live/${domain}/`;
  const remoteExec = async (ip, cmd) => {
    await spawn('ssh', [
      '-o',
      'StrictHostKeyChecking=no',
      '-i',
      '/cloud/hyperion/hyperion.key',
      `root@${ip}`,
      '-t',
      cmd,
    ]);
  };
  const remoteExecNodesOnCluster = async (clusterName, cmd) => {
    const { nodes } = clusterData[clusterName];
    const results = await Promise.all(
      Object.keys(nodes).map(async nodeName => {
        const node = nodes[nodeName];
        if (node.type !== 'node') return null;
        return {
          node,
          nodeName,
          clusterName,
          result: await remoteExec(node.ipv4_address, cmd),
        };
      }),
    );
    return results.filter(r => !!r);
  };
  const rsync = async (source, ip, dest) => {
    await spawn(
      'rsync',
      [
        '-rvzL',
        '-e',
        'ssh -o StrictHostKeyChecking=no -i /cloud/hyperion/hyperion.key',
        source,
        `root@${ip}:${dest}`,
      ],
      {
        stdio: 'inherit',
      },
    );
    console.log('copied ', source, ip, dest);
  };
  const rsyncToCluster = async (source, clusterName, dest) => {
    const { nodes } = clusterData[clusterName];
    const results = await Promise.all(
      Object.keys(nodes).map(async nodeName => {
        const node = nodes[nodeName];
        if (node.type !== 'node') return null;
        await rsync(source, node.ipv4_address, dest);
        return {
          node,
          nodeName,
        };
      }),
    );
    return results.filter(r => !!r);
  };
  const refreshDomainKeysForCluster = async (clusterName, domain) => {
    const cluster = clusterData[clusterName];
    console.log(`SSL for ${domain} on ${clusterName}`);
    try {
      await spawn('certbot', ['certonly', '-n', '--keep', '-d', domain], {
        stdio: 'inherit',
      });
    } catch (e) {
      console.error('Could not get domain cert!', domain);
      console.error(e);
    }
    const keyDir = keyDirOfDomain(domain);
    let hasCert = false;
    if (
      (await fs.exists(join(keyDir, 'privkey.pem'))) &&
      (await fs.exists(join(keyDir, 'fullchain.pem')))
    ) {
      hasCert = true;
      await Promise.all(
        Object.keys(cluster.nodes).map(async nodeName => {
          const node = cluster.nodes[nodeName];
          if (node.type !== 'node') return;
          await remoteExec(node.ipv4_address, `mkdir -p ${keyDir}`);
          await rsync(keyDir, node.ipv4_address, keyDir);
        }),
      );
    }

    return {
      hasCert,
    };
  };

  for (let i = 0; i < clusterNames.length; i++) {
    const clusterName = clusterNames[i];
    const cluster = clusters[clusterName];
    const clusterHost = `${clusterName}.aven.cloud`;

    const hosts = {};

    hosts[clusterHost] = await refreshDomainKeysForCluster(
      clusterName,
      clusterHost,
    );

    await Promise.all(
      cluster.publicHosts.map(async publicHost => {
        hosts[publicHost] = await refreshDomainKeysForCluster(
          clusterName,
          publicHost,
        );
      }),
    );

    const allClusterHosts = Object.keys(hosts);
    const activeClusterHosts = allClusterHosts.filter(
      hostName => hosts[hostName].hasCert,
    );

    const config = nginxConfig({
      sslHostnames: activeClusterHosts,
      clusterName,
    });
    const localNginxCopy = `/node_configs/${clusterName}.nginx.conf`;
    await fs.writeFile(localNginxCopy, config);
    await rsyncToCluster(localNginxCopy, clusterName, '/etc/nginx/nginx.conf');
    const reloadResults = await remoteExecNodesOnCluster(
      clusterName,
      'nginx -s reload',
    );
  }

  console.log('Time to update the code for all nodes!');

  return clusterData;
}

goTerra()
  .then(clusterData => {
    console.log('Done!', JSON.stringify(clusterData, null, 2));
  })
  .catch(console.error);
