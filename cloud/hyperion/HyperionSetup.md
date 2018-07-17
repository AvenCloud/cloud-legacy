Hyperion is basically a Hera cluster server with a few extra things set up and installed

- the /.env file must include DIGITALOCEAN_TOKEN, CLOUDFLARE_TOKEN, CLOUDFLARE_EMAIL
- the clusters must be defined with a /clusters.json
- the terraform state will live in /hyperion/terraform.tfstate