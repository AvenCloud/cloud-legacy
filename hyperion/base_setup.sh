#!/bin/bash

export DEBIAN_FRONTEND="noninteractive";

echo "Base Aven Image Setup"

apt remove -y cmdtest # comes with debian and also provides a yarn command
apt remove -y nodejs

apt update
apt install -y curl
apt install -y rsync
apt install -y apt-transport-https

apt upgrade -y


apt autoremove -y
