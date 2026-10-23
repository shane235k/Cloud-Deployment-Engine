output "instance_id" {
  description = "EC2 instance ID"
  value       = aws_instance.kubedeploy.id
}

output "private_ip" {
  description = "Private IP address of the node in the private subnet"
  value       = aws_instance.kubedeploy.private_ip
}

output "public_ip" {
  description = "Public IPv4 address assigned to the EC2 node for administrative SSH access"
  value       = aws_instance.kubedeploy.public_ip
}

output "private_dns" {
  description = "Private DNS hostname"
  value       = aws_instance.kubedeploy.private_dns
}

output "is_control_plane" {
  description = "Whether this node is running as K3s Server (control plane)"
  value       = var.is_control_plane
}

output "node_role" {
  description = "Cluster role of this node (SERVER or AGENT)"
  value       = var.is_control_plane ? "SERVER" : "AGENT"
}

output "instance_name" {
  description = "Name tag assigned to this instance"
  value       = var.instance_name
}
