output "security_group_id" {
  description = "Shared Security Group ID for KubeDeploy"
  value       = module.base_infrastructure.security_group_id
}

output "vpc_id" {
  description = "Default VPC ID"
  value       = module.base_infrastructure.vpc_id
}

output "subnet_id" {
  description = "Default Subnet ID"
  value       = module.base_infrastructure.subnet_id
}
