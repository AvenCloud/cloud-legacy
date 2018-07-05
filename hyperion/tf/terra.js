const fs = require('fs-extra');
const spawn = require('@expo/spawn-async');

const tfConfig = {
  variable: {
    server_public_key: { description: 'ssh public key' },
    server_private_key: { description: 'ssh private key' },
    digitalocean_token: { description: 'Digital Ocean Secret Key' },
    cloudflare_email: { description: 'Cloudflare Email Address' },
    cloudflare_token: { description: 'Cloudflare Secret Key' },
    name: { description: 'Name of server or cluster' },
  },
  provider: {
    digitalocean: {
      token: '${var.digitalocean_token}',
    },
    cloudflare: {
      email: '${var.cloudflare_email}',
      token: '${var.cloudflare_token}',
    },
  },
  resource: {
    digitalocean_ssh_key: {
      ssh: {
        name: 'DigitalOcean SSH Key',
        public_key: '${var.server_public_key}',
      },
    },
    digitalocean_droplet: {
      hera: {
        ssh_keys: ['${digitalocean_ssh_key.ssh.id}'],
        image: 'ubuntu-18-04-x64',
        region: 'nyc3',
        size: 's-1vcpu-1gb',
        private_networking: true,
        name: '${var.name}',

        count: '3',

        provisioner: {
          'remote-exec': {
            script: 'hera-setup.sh',
            connection: {
              type: 'ssh',
              private_key: '${var.server_private_key}',
              user: 'root',
              timeout: '2m',
            },
          },
        },
      },
    },

    digitalocean_loadbalancer: {
      public: {
        name: 'loadbalance-${var.name}',
        region: 'nyc3',
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
        droplet_ids: ['${digitalocean_droplet.hera.*.id}'],
      },
    },

    cloudflare_record: {
      www: {
        domain: 'aven.cloud',
        name: '${var.name}',
        value: '${digitalocean_loadbalancer.public.ip}',
        type: 'A',
        ttl: 3600,
      },
    },
  },
};

async function goTerra() {
  await fs.writeFile('terra-out.tf.json', JSON.stringify(tfConfig, null, 2));

  await spawn(
    'terraform',
    ['apply', '-var-file', './tfvars', '-auto-approve'],
    { stdio: 'inherit' },
  );
}

goTerra()
  .then(() => {
    console.log('Done terraforming');
  })
  .catch(console.error);
