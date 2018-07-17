#!/bin/bash

export DEBIAN_FRONTEND="noninteractive";

echo "Node Aven Image Setup"

curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
apt install -y nginx
apt install -y software-properties-common
apt update

curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
apt install -y nodejs

apt install -y yarn
apt install -y unzip
apt upgrade -y

cd /cloud
yarn
yarn build

cp /cloud/hyperion/config/avencloud.service /etc/systemd/system/avencloud.service

systemctl daemon-reload
systemctl enable avencloud
systemctl start avencloud


systemctl enable nginx