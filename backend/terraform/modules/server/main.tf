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
  ami                         = data.aws_ami.ubuntu.id
  instance_type               = var.instance_type
  key_name                    = var.key_name
  subnet_id                   = var.subnet_id
  vpc_security_group_ids      = [var.security_group_id]
  associate_public_ip_address = true
  iam_instance_profile        = var.iam_instance_profile_name != "" ? var.iam_instance_profile_name : null

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 2
    instance_metadata_tags      = "disabled"
  }

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  user_data = <<-EOF
              #!/bin/bash
              # 0. Configure 2GB swap space for memory stability on t3.micro
              if [ ! -f /swapfile ]; then
                fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
                chmod 600 /swapfile
                mkswap /swapfile
                swapon /swapfile
                echo '/swapfile none swap sw 0 0' >> /etc/fstab
              fi

              # 1. Update system packages and install dependencies
              apt-get update -y
              apt-get install -y curl docker.io jq unzip

              curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o /tmp/awscliv2.zip
              unzip -q /tmp/awscliv2.zip -d /tmp
              /tmp/aws/install
              rm -rf /tmp/aws /tmp/awscliv2.zip

              systemctl enable docker
              systemctl start docker
              usermod -aG docker ubuntu

              # Extract primary private IP address
              PRIVATE_IP=$(hostname -I | awk '{print $1}')

              # Query AWS Region via IMDSv2
              IMDS_TOKEN=$(curl -s -S -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
              AWS_REGION=$(curl -s -S -H "X-aws-ec2-metadata-token: $IMDS_TOKEN" http://169.254.169.254/latest/meta-data/placement/region)

              %{if var.is_control_plane~}
              # -------------------------------------------------------------
              # K3s SERVER (Control Plane) Bootstrap
              # -------------------------------------------------------------
              echo "Checking if K3s cluster join token already exists in SSM Parameter Store (${var.ssm_parameter_name})..."
              EXISTING_TOKEN=$(aws ssm get-parameter --name "${var.ssm_parameter_name}" --with-decryption --query "Parameter.Value" --output text --region "$AWS_REGION" 2>/dev/null || true)

              if [ -n "$EXISTING_TOKEN" ] && [ "$EXISTING_TOKEN" != "None" ]; then
                echo "Reusing existing K3s cluster join token from SSM Parameter Store..."
                K3S_TOKEN="$EXISTING_TOKEN"
              else
                echo "Generating new cryptographically secure K3s cluster join token..."
                NEW_TOKEN=$(openssl rand -hex 32)
                echo "Writing K3s cluster join token to SSM Parameter Store as SecureString..."
                if aws ssm put-parameter \
                  --name "${var.ssm_parameter_name}" \
                  --type SecureString \
                  --value "$NEW_TOKEN" \
                  --description "KubeDeploy K3s cluster join token" \
                  --region "$AWS_REGION" 2>/dev/null; then
                  echo "K3s cluster join token stored in SSM Parameter Store."
                  K3S_TOKEN="$NEW_TOKEN"
                else
                  echo "Parameter exists or was created concurrently. Re-fetching existing token..."
                  K3S_TOKEN=$(aws ssm get-parameter --name "${var.ssm_parameter_name}" --with-decryption --query "Parameter.Value" --output text --region "$AWS_REGION")
                fi
              fi

              echo "Initializing K3s Control Plane Server on private IP: $PRIVATE_IP..."

              # Install K3s server
              # Traefik is kept ENABLED as the cluster-wide shared Ingress Controller
              # local-storage disabled for lean cloud architecture; ServiceLB enabled for ALB port 80 binding
              curl -sfL https://get.k3s.io | \
                INSTALL_K3S_EXEC="server \
                  --token=$K3S_TOKEN \
                  --node-ip=$PRIVATE_IP \
                  --advertise-address=$PRIVATE_IP \
                  --tls-san=$PRIVATE_IP \
                  --disable local-storage \
                  --write-kubeconfig-mode 644" \
                sh -

              systemctl enable k3s
              systemctl start k3s
              chmod 644 /etc/rancher/k3s/k3s.yaml

              echo "K3s Server initialized successfully."
              %{else~}
              # -------------------------------------------------------------
              # K3s AGENT (Worker Node) Bootstrap
              # -------------------------------------------------------------
              K3S_SERVER_URL="https://${var.k3s_server_private_ip}:6443"
              echo "Preparing to join K3s cluster via server at $K3S_SERVER_URL..."

              echo "Retrieving K3s cluster join token from SSM Parameter Store (${var.ssm_parameter_name})..."
              until K3S_TOKEN=$(aws ssm get-parameter --name "${var.ssm_parameter_name}" --with-decryption --query "Parameter.Value" --output text --region "$AWS_REGION" 2>/dev/null) && [ -n "$K3S_TOKEN" ] && [ "$K3S_TOKEN" != "None" ]; do
                echo "Waiting for K3s join token in SSM Parameter Store (${var.ssm_parameter_name})..."
                sleep 5
              done
              echo "K3s cluster join token retrieved successfully."

              # Wait for K3s Server API endpoint to respond over private network
              until curl -k -s -f "$K3S_SERVER_URL/cacerts" >/dev/null 2>&1; do
                echo "Waiting for K3s server ($K3S_SERVER_URL) to become ready..."
                sleep 5
              done

              echo "K3s Server is responsive. Joining cluster as Agent..."

              curl -sfL https://get.k3s.io | \
                K3S_URL="$K3S_SERVER_URL" \
                K3S_TOKEN="$K3S_TOKEN" \
                INSTALL_K3S_EXEC="agent --node-ip=$PRIVATE_IP" \
                sh -

              systemctl enable k3s-agent
              systemctl start k3s-agent

              echo "K3s Agent joined cluster successfully."
              %{endif~}
              EOF

  tags = {
    Name    = var.instance_name
    Role    = var.is_control_plane ? "server" : "agent"
    Cluster = "kubedeploy"
  }
}
