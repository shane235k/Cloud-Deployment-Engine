output "vpc_id" {
  description = "ID of the custom VPC"
  value       = module.base_infrastructure.vpc_id
}

output "vpc_cidr" {
  description = "CIDR block of the custom VPC"
  value       = module.base_infrastructure.vpc_cidr
}

output "public_subnet_1_id" {
  description = "ID of public subnet 1 (ALB AZ A & K3s node placement)"
  value       = module.base_infrastructure.public_subnet_1_id
}

output "public_subnet_2_id" {
  description = "ID of public subnet 2 (ALB AZ B)"
  value       = module.base_infrastructure.public_subnet_2_id
}

output "public_subnet_ids" {
  description = "List of public subnet IDs"
  value       = module.base_infrastructure.public_subnet_ids
}

output "alb_security_group_id" {
  description = "Security Group ID for the shared Application Load Balancer"
  value       = module.base_infrastructure.alb_security_group_id
}

output "node_security_group_id" {
  description = "Security Group ID for K3s cluster nodes"
  value       = module.base_infrastructure.node_security_group_id
}

output "security_group_id" {
  description = "Backward-compatible alias for K3s cluster nodes Security Group ID"
  value       = module.base_infrastructure.security_group_id
}

output "alb_arn" {
  description = "ARN of the shared Application Load Balancer"
  value       = module.base_infrastructure.alb_arn
}

output "alb_dns_name" {
  description = "Public DNS hostname of the shared Application Load Balancer"
  value       = module.base_infrastructure.alb_dns_name
}

output "alb_target_group_arn" {
  description = "ARN of the HTTP target group forwarding to K3s Ingress Controller"
  value       = module.base_infrastructure.alb_target_group_arn
}

output "alb_listener_arn" {
  description = "ARN of the HTTP listener on the shared Application Load Balancer"
  value       = module.base_infrastructure.alb_listener_arn
}

output "server_iam_instance_profile_name" {
  description = "Name of the IAM instance profile for the K3s Server (control plane)"
  value       = module.base_infrastructure.server_iam_instance_profile_name
}

output "agent_iam_instance_profile_name" {
  description = "Name of the IAM instance profile for K3s Agents (worker nodes)"
  value       = module.base_infrastructure.agent_iam_instance_profile_name
}

output "ssm_parameter_name" {
  description = "SSM Parameter Store name for the cluster join token"
  value       = module.base_infrastructure.ssm_parameter_name
}

