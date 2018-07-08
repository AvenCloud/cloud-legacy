#!/bin/bash

export DEBIAN_FRONTEND="noninteractive";

echo "Postgres Aven Image Setup"


apt update

apt install -y software-properties-common
apt install -y postgresql postgresql-contrib

apt upgrade -y

sudo -u postgres createuser cloud
sudo -u postgres createdb -O cloud cloud

echo "listen_addresses = '*'" | tee -a /etc/postgresql/9.6/main/postgresql.conf 

echo "hostssl	all		all		0.0.0.0/0		md5" | tee -a /etc/postgresql/9.6/main/pg_hba.conf