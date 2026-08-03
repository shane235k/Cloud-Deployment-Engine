data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_instance" "kubedeploy" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  key_name               = var.key_name
  vpc_security_group_ids = [var.security_group_id]

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  user_data = <<-EOF
              #!/bin/bash
              set -e

              apt-get update -y
              apt-get install -y curl docker.io

              systemctl enable docker
              systemctl start docker

              usermod -aG docker ubuntu

              curl -sfL https://get.k3s.io | \
                INSTALL_K3S_EXEC="server --disable traefik --disable servicelb --disable local-storage" \
                sh -

              chmod 644 /etc/rancher/k3s/k3s.yaml
              EOF

  tags = {
    Name = var.instance_name
  }
}

resource "aws_eip" "kubedeploy_ip" {
  domain   = "vpc"
  instance = aws_instance.kubedeploy.id
}
