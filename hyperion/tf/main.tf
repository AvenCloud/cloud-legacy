
variable "do_token" {
  description = "Digital Ocean Secret Key"
}

variable "cloudflare_email" {
  description = "Cloudflare Email Address"
}

variable "cloudflare_token" {
  description = "Cloudflare Secret Key"
}

variable "name" {
  description = "Name of new server or cluster"
}

provider "digitalocean" {
  token = "${var.do_token}"
}

provider "cloudflare" {
  email = "${var.cloudflare_email}"
  token = "${var.cloudflare_token}"
}

resource "digitalocean_ssh_key" "ssh" {
    name = "Terraform DO Example"
    public_key = "${file("digital_ocean_key.pub")}"
}


resource "digitalocean_droplet" "mywebserver" {
  ssh_keys = ["${digitalocean_ssh_key.ssh.id}"]  
  image              = "ubuntu-18-04-x64"
  region             = "nyc3"
  size               = "s-1vcpu-1gb"
  private_networking = true
  name               = "${var.name}"

  provisioner "remote-exec" {
    inline = [
      "export PATH=$PATH:/usr/bin",
      "sudo apt update",
      "sudo apt -y upgrade",
      "sudo apt -y install nginx",
    ]

    connection {
      type     = "ssh"
      private_key = "${file("digital_ocean_key")}"
      user     = "root"
      timeout  = "2m"
    }
  }
}

resource "digitalocean_domain" "cruz-aven-cloud" {
  name       = "${}.aven.cloud"
  ip_address = "${digitalocean_droplet.mywebserver.ipv4_address}"
}

resource "digitalocean_record" "cruz" {
  domain = "${digitalocean_domain.cruz-aven-cloud.name}"
  type   = "A"
  name   = "cruz"
  value  = "${digitalocean_droplet.mywebserver.ipv4_address}"
}