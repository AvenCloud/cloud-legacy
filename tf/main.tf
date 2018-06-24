provider "digitalocean" {
  token = "${var.do_token}"
}

resource "digitalocean_ssh_key" "ssh" {
    name = "Terraform DO Example"
    public_key = "${file("digital_ocean_key.pub")}"
}

resource "digitalocean_droplet" "mywebserver" {
  ssh_keys = ["${digitalocean_ssh_key.ssh.id}"]  
  image              = "${var.ubuntu}"
  region             = "${var.do_ams3}"
  size               = "s-1vcpu-1gb"
  private_networking = true
  backups            = true
  ipv6               = true
  name               = "mywebserver-ams3"

  provisioner "remote-exec" {
    inline = [
      "export PATH=$PATH:/usr/bin",
      "sudo apt-get update",
      "sudo apt-get -y install nginx",
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
  name       = "cruz.aven.cloud"
  ip_address = "${digitalocean_droplet.mywebserver.ipv4_address}"
}

resource "digitalocean_record" "cruz" {
  domain = "${digitalocean_domain.cruz-aven-cloud.name}"
  type   = "A"
  name   = "cruz"
  value  = "${digitalocean_droplet.mywebserver.ipv4_address}"
}