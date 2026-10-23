variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-2"
}

variable "key_name" {
  description = "EC2 key pair name"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.medium"
}

variable "instance_name" {
  description = "Name tag for the EC2 instance"
  type        = string
  default     = "kubedeploy-server"
}

variable "subnet_id" {
  description = "Private Subnet ID where the EC2 node resides"
  type        = string
}

variable "security_group_id" {
  description = "Security Group ID for K3s cluster nodes"
  type        = string
}

variable "is_control_plane" {
  description = "Whether this EC2 instance initializes as K3s Server (control plane) or joins as K3s Agent"
  type        = bool
  default     = true
}

variable "k3s_server_private_ip" {
  description = "Private IP of K3s control-plane server (required when is_control_plane is false)"
  type        = string
  default     = ""
}

variable "iam_instance_profile_name" {
  description = "IAM instance profile name attached to EC2 node for SSM parameter access"
  type        = string
  default     = ""
}

variable "ssm_parameter_name" {
  description = "SSM Parameter Store name where the K3s cluster join token is stored"
  type        = string
  default     = "/kubedeploy/k3s-join-token"
}
