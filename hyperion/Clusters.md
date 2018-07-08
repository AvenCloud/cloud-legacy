# Server Lifecycle


## Create the Base Image:

- Start new droplet on DO with Debian 9 x64 and local ssh key

SETUP_IP=206.189.211.210
scp -o StrictHostKeyChecking=no hyperion/base_setup.sh "root@$SETUP_IP:/base_setup.sh"
ssh "root@$SETUP_IP" -t "chmod u+x /base_setup.sh && /base_setup.sh" -o StrictHostKeyChecking=no
ssh "root@$SETUP_IP" -t "shutdown now"

## Setup a `artemis-node` Image:

- Fork a base image

SETUP_IP=206.189.211.210
rsync -e "ssh -o StrictHostKeyChecking=no" --exclude=node_modules -r . "root@$SETUP_IP:/cloud"
ssh "root@$SETUP_IP" -t "chmod u+x /cloud/hyperion/node_setup.sh && /cloud/hyperion/node_setup.sh" -o StrictHostKeyChecking=no
  ssh "root@$SETUP_IP" -t "shutdown now"


## Setup a `artemis-pg` Image:

- Fork a base image

SETUP_IP=178.128.191.113
scp -o StrictHostKeyChecking=no pg_setup.sh "root@$SETUP_IP:/pg_setup.sh"
ssh "root@$SETUP_IP" -t "chmod u+x /pg_setup.sh && /pg_setup.sh" -o StrictHostKeyChecking=no
ssh "root@$SETUP_IP" -t "shutdown now"


## Setup a `hera` image

- Fork a base image




# Deploy a new site

Dreate new droplets from the appropriate images. For hera clusters, you need a single hera image. For artemis clusters, this includes a pg server plus node servers. You are also responsible for round-robin load balancing between the node servers on port 80 and 443


Run the following to configure the PG server:


SETUP_IP=159.89.155.184
SETUP_PG_PASS=foobar1234
scp -o StrictHostKeyChecking=no pg_deploy.sh "root@$SETUP_IP:/pg_deploy.sh"
ssh -o StrictHostKeyChecking=no "root@$SETUP_IP" -t "chmod u+x /pg_deploy.sh && SETUP_PG_PASS=$SETUP_PG_PASS SETUP_HOSTNAME=$SETUP_HOSTNAME /pg_deploy.sh"


On each of the node servers, run the following:

SETUP_IP=159.89.155.184
SETUP_PG_PASS=foobar1234
SETUP_PG_IP=159.89.155.184
SETUP_HOSTNAME=cloud.aven.io
rsync -e "ssh -o StrictHostKeyChecking=no" --exclude=node_modules -r . "root@$SETUP_IP:/cloud"
ssh -o StrictHostKeyChecking=no "root@$SETUP_IP" -t "chmod u+x /cloud/hyperion/node_deploy.sh && SETUP_PG_PASS=$SETUP_PG_PASS SETUP_HOSTNAME=$SETUP_HOSTNAME /cloud/hyperion/node_deploy.sh"

Point the A record of the SETUP_HOSTNAME to the load balancer. Then setup HTTPS:


# Image env variables

To use new images in production, set the image IDs within the `.env` variable of `/cloud` on hyperion. This change will only work for *new* clusters