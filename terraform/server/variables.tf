variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-2"
}

variable "key_name" {
  description = "EC2 key pair name"
  type        = string
  default     = "p377-key"
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

variable "is_control_plane" {
  description = "Whether this node initializes as K3s Server or joins as K3s Agent"
  type        = bool
  default     = true
}

variable "k3s_server_private_ip" {
  description = "Private IP of K3s control-plane server (required when is_control_plane is false)"
  type        = string
  default     = ""
}

variable "iam_instance_profile_name" {
  description = "Optional override for IAM instance profile name (defaults to reading from base remote state)"
  type        = string
  default     = ""
}

variable "ssm_parameter_name" {
  description = "Optional override for SSM parameter name (defaults to reading from base remote state)"
  type        = string
  default     = ""
}

variable "subnet_id" {
  description = "Optional override for private subnet ID (defaults to reading from base remote state)"
  type        = string
  default     = ""
}

variable "security_group_id" {
  description = "Optional override for K3s node security group ID (defaults to reading from base remote state)"
  type        = string
  default     = ""
}
