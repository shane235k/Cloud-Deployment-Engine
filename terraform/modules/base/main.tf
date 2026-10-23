data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_region" "current" {}

data "aws_caller_identity" "current" {}

locals {
  k3s_token_param_name = "/${var.environment_name}/k3s-join-token"
  k3s_token_param_arn  = "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter${local.k3s_token_param_name}"
}

# 1. Custom VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.environment_name}-vpc"
  }
}

# 2. Public Subnets (2 AZs required for AWS Application Load Balancer)
resource "aws_subnet" "public_1" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_1_cidr
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.environment_name}-public-subnet-1"
    Type = "public"
  }
}

resource "aws_subnet" "public_2" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_2_cidr
  availability_zone       = data.aws_availability_zones.available.names[1]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.environment_name}-public-subnet-2"
    Type = "public"
  }
}

# 3. Internet Gateway
resource "aws_internet_gateway" "gw" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.environment_name}-igw"
  }
}

# 4. Public Route Table & Associations
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.gw.id
  }

  tags = {
    Name = "${var.environment_name}-public-rt"
  }
}

resource "aws_route_table_association" "public_1" {
  subnet_id      = aws_subnet.public_1.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_2" {
  subnet_id      = aws_subnet.public_2.id
  route_table_id = aws_route_table.public.id
}

# 8. Security Groups
# 8a. Shared Application Load Balancer Security Group
resource "aws_security_group" "alb_sg" {
  name        = "${var.environment_name}-alb-sg"
  description = "Controls external traffic to the shared KubeDeploy Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "Allow inbound HTTP from internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outbound traffic to backend targets"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.environment_name}-alb-sg"
  }
}

# 8b. K3s Nodes (Server & Agents) Security Group
resource "aws_security_group" "k3s_nodes_sg" {
  name        = "${var.environment_name}-nodes-sg"
  description = "Controls traffic for KubeDeploy K3s server and agent cluster nodes"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "Allow HTTP traffic from shared Application Load Balancer and direct fallback access"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    cidr_blocks     = ["0.0.0.0/0"]
    security_groups = [aws_security_group.alb_sg.id]
  }

  ingress {
    description     = "Allow Kubernetes NodePort range from shared Application Load Balancer and direct fallback access"
    from_port       = 30000
    to_port         = 32767
    protocol        = "tcp"
    cidr_blocks     = ["0.0.0.0/0"]
    security_groups = [aws_security_group.alb_sg.id]
  }

  ingress {
    description = "Allow complete internal cluster communication across K3s nodes"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    self        = true
  }

  ingress {
    description = "Allow internal VPC traffic across cluster nodes (apiserver 6443, flannel 8472, kubelet 10250)"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = [var.vpc_cidr]
  }

  ingress {
    description = "Administrative SSH access"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.admin_ssh_cidr]
  }

  egress {
    description = "Allow all outbound traffic (routed through NAT Gateway)"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.environment_name}-nodes-sg"
  }
}

# 9. Shared AWS Application Load Balancer (ALB)
resource "aws_lb" "shared_alb" {
  name               = "${var.environment_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets            = [aws_subnet.public_1.id, aws_subnet.public_2.id]

  enable_deletion_protection = false

  tags = {
    Name = "${var.environment_name}-alb"
  }
}

# 10. ALB HTTP Target Group (Points to K3s Ingress Controller on Port 80)
resource "aws_lb_target_group" "k3s_http" {
  name        = "${var.environment_name}-tg-http"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "instance"

  health_check {
    enabled             = true
    path                = "/ping"
    protocol            = "HTTP"
    matcher             = "200-404"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }

  tags = {
    Name = "${var.environment_name}-tg-http"
  }
}

# 11. ALB HTTP Listener
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.shared_alb.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.k3s_http.arn
  }
}

# 12. K3s Server (Control Plane) IAM Role & Instance Profile
# Permissions: PutParameter and GetParameter strictly scoped to the cluster join token SSM parameter
resource "aws_iam_role" "k3s_server_role" {
  name = "${var.environment_name}-k3s-server-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name = "${var.environment_name}-k3s-server-role"
    Role = "control-plane"
  }
}

resource "aws_iam_role_policy" "k3s_server_policy" {
  name = "${var.environment_name}-k3s-server-policy"
  role = aws_iam_role.k3s_server_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "SSMJoinTokenAccess"
        Effect = "Allow"
        Action = [
          "ssm:PutParameter",
          "ssm:GetParameter",
          "ssm:GetParameters"
        ]
        Resource = local.k3s_token_param_arn
      },
      {
        Sid    = "KMSDecryptSSM"
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:ViaService" = "ssm.${data.aws_region.current.name}.amazonaws.com"
          }
        }
      }
    ]
  })
}

resource "aws_iam_instance_profile" "k3s_server_profile" {
  name = "${var.environment_name}-k3s-server-profile"
  role = aws_iam_role.k3s_server_role.name

  tags = {
    Name = "${var.environment_name}-k3s-server-profile"
  }
}

# 13. K3s Agent (Worker Node) IAM Role & Instance Profile
# Permissions: GetParameter ONLY strictly scoped to the cluster join token SSM parameter
resource "aws_iam_role" "k3s_agent_role" {
  name = "${var.environment_name}-k3s-agent-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name = "${var.environment_name}-k3s-agent-role"
    Role = "worker-agent"
  }
}

resource "aws_iam_role_policy" "k3s_agent_policy" {
  name = "${var.environment_name}-k3s-agent-policy"
  role = aws_iam_role.k3s_agent_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "SSMJoinTokenRead"
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters"
        ]
        Resource = local.k3s_token_param_arn
      },
      {
        Sid    = "KMSDecryptSSM"
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:ViaService" = "ssm.${data.aws_region.current.name}.amazonaws.com"
          }
        }
      }
    ]
  })
}

resource "aws_iam_instance_profile" "k3s_agent_profile" {
  name = "${var.environment_name}-k3s-agent-profile"
  role = aws_iam_role.k3s_agent_role.name

  tags = {
    Name = "${var.environment_name}-k3s-agent-profile"
  }
}


