const SSLConfig = ({ clusterName, sslHostnames }) =>
  sslHostnames
    .map(
      hostName => `

server {

	listen 443 ssl;
	listen [::]:443 ssl;
	ssl_certificate     /etc/letsencrypt/live/${hostName}/fullchain.pem;
	ssl_certificate_key /etc/letsencrypt/live/${hostName}/privkey.pem;
	
	server_name ${hostName};

	location / {
		proxy_http_version 1.1;
		proxy_pass http://127.0.0.1:8080;
		proxy_set_header X-Forwarded-Proto https;
		proxy_set_header X-Real-IP $remote_adddr;
		proxy_set_header X-Forwarded-Ssl on;
		proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

		proxy_set_header Upgrade $http_upgrade;
		proxy_set_header Connection $connection_upgrade;
	}

}

`,
    )
    .join('\n');

module.exports = ({ clusterName, sslHostnames }) => `


user www-data;
worker_processes auto;
pid /run/nginx.pid;

events {
	worker_connections 768;
	# multi_accept on;
}

http {

	##
	# Basic Settings
	##

	sendfile on;
	tcp_nopush on;
	tcp_nodelay on;
	keepalive_timeout 65;
	types_hash_max_size 2048;
	# server_tokens off;

	# server_names_hash_bucket_size 64;
	# server_name_in_redirect off;

	include /etc/nginx/mime.types;
	default_type application/octet-stream;

	map $http_upgrade $connection_upgrade {
			default upgrade;
			'' close;
	}

	##
	# SSL Settings
	##

	ssl_protocols TLSv1 TLSv1.1 TLSv1.2; # Dropping SSLv3, ref: POODLE
	ssl_prefer_server_ciphers on;

	##
	# Logging Settings
	##

	access_log /var/log/nginx/access.log;
	error_log /var/log/nginx/error.log;

	##
	# Gzip Settings
	##

	gzip on;
	gzip_disable "msie6";

	# gzip_vary on;
	# gzip_proxied any;
	# gzip_comp_level 6;
	# gzip_buffers 16 8k;
	# gzip_http_version 1.1;
	# gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

	server {
		listen 80 default_server;
		listen [::]:80 default_server;

		location ^~ /.well-known/acme-challenge/ {
			proxy-pass https://hyperion.aven.cloud;
		}
		location / {
			return 301 https://$http_host$request_uri;
		}
	}
	
	${SSLConfig({ clusterName, sslHostnames })}
}

`;
