output "vpc_id" {
  description = "ID of the custom VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "CIDR block of the custom VPC"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_1_id" {
  description = "ID of public subnet 1 (ALB AZ A & K3s node placement)"
  value       = aws_subnet.public_1.id
}

output "public_subnet_2_id" {
  description = "ID of public subnet 2 (ALB AZ B)"
  value       = aws_subnet.public_2.id
}

output "public_subnet_ids" {
  description = "List of public subnet IDs"
  value       = [aws_subnet.public_1.id, aws_subnet.public_2.id]
}

output "alb_security_group_id" {
  description = "Security Group ID for the shared Application Load Balancer"
  value       = aws_security_group.alb_sg.id
}

output "node_security_group_id" {
  description = "Security Group ID for K3s cluster nodes"
  value       = aws_security_group.k3s_nodes_sg.id
}

output "security_group_id" {
  description = "Backward-compatible alias for K3s cluster nodes Security Group ID"
  value       = aws_security_group.k3s_nodes_sg.id
}

output "alb_arn" {
  description = "ARN of the shared Application Load Balancer"
  value       = aws_lb.shared_alb.arn
}

output "alb_dns_name" {
  description = "Public DNS hostname of the shared Application Load Balancer"
  value       = aws_lb.shared_alb.dns_name
}

output "alb_target_group_arn" {
  description = "ARN of the HTTP target group forwarding to K3s Ingress Controller"
  value       = aws_lb_target_group.k3s_http.arn
}

output "alb_listener_arn" {
  description = "ARN of the HTTP listener on the shared Application Load Balancer"
  value       = aws_lb_listener.http.arn
}

output "server_iam_instance_profile_name" {
  description = "Name of the IAM instance profile for the K3s Server (control plane)"
  value       = aws_iam_instance_profile.k3s_server_profile.name
}

output "agent_iam_instance_profile_name" {
  description = "Name of the IAM instance profile for K3s Agents (worker nodes)"
  value       = aws_iam_instance_profile.k3s_agent_profile.name
}

output "ssm_parameter_name" {
  description = "SSM Parameter Store name for the cluster join token"
  value       = local.k3s_token_param_name
}

