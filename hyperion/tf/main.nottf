variable "server_public_key" {
  description = "ssh public key"
}

variable "server_private_key" {
  description = "ssh private key"
}

variable "digitalocean_token" {
  description = "Digital Ocean Secret Key"
}

variable "cloudflare_email" {
  description = "Cloudflare Email Address"
}

variable "cloudflare_token" {
  description = "Cloudflare Secret Key"
}

variable "name" {
  description = "Name of server or cluster"
}

provider "digitalocean" {
  token = "${var.digitalocean_token}"
}

provider "cloudflare" {
  email = "${var.cloudflare_email}"
  token = "${var.cloudflare_token}"
}

resource "digitalocean_ssh_key" "ssh" {
  name       = "DigitalOcean SSH Key"
  public_key = "${var.server_public_key}"
}

resource "digitalocean_droplet" "hera" {
  ssh_keys           = ["${digitalocean_ssh_key.ssh.id}"]
  image              = "ubuntu-18-04-x64"
  region             = "nyc3"
  size               = "s-1vcpu-1gb"
  private_networking = true
  name               = "${var.name}"

  count = "3"

  provisioner "remote-exec" {
    script = "hera-setup.sh"

    connection {
      type        = "ssh"
      private_key = "${var.server_private_key}"
      user        = "root"
      timeout     = "2m"
    }
  }
}

resource "digitalocean_loadbalancer" "public" {
  name   = "loadbalance-${var.name}"
  region = "nyc3"

  forwarding_rule {
    entry_port     = 80
    entry_protocol = "http"

    target_port     = 80
    target_protocol = "http"
  }

  forwarding_rule {
    entry_port     = 443
    entry_protocol = "https"

    target_port     = 443
    target_protocol = "https"

    tls_passthrough = true
  }

  healthcheck {
    port     = 22
    protocol = "tcp"
  }

  droplet_ids = ["${digitalocean_droplet.hera.*.id}"]
}

resource "cloudflare_record" "www" {
  domain = "aven.cloud"
  name   = "${var.name}"
  value  = "${digitalocean_loadbalancer.public.ip}"
  type   = "A"
  ttl    = 3600
}
