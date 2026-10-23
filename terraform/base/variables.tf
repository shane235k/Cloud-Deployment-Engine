variable "aws_region" {
  description = "AWS region for infrastructure provisioning"
  type        = string
  default     = "us-east-2"
}

variable "environment_name" {
  description = "Prefix name for all platform infrastructure resources"
  type        = string
  default     = "kubedeploy"
}

variable "vpc_cidr" {
  description = "CIDR block for the custom VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_1_cidr" {
  description = "CIDR block for public subnet 1 (ALB AZ A & K3s node placement)"
  type        = string
  default     = "10.0.1.0/24"
}

variable "public_subnet_2_cidr" {
  description = "CIDR block for public subnet 2 (ALB AZ B)"
  type        = string
  default     = "10.0.2.0/24"
}

variable "admin_ssh_cidr" {
  description = "CIDR block permitted for administrative SSH access (default 0.0.0.0/0, secured by SSH key pair authentication)"
  type        = string
  default     = "0.0.0.0/0"
}

