output "security_group_id" {
  description = "Shared Security Group ID for KubeDeploy servers"
  value       = aws_security_group.kubedeploy_sg.id
}

output "vpc_id" {
  description = "Default VPC ID"
  value       = data.aws_vpc.default.id
}

output "subnet_id" {
  description = "Default Subnet ID"
  value       = element(data.aws_subnets.default.ids, 0)
}
