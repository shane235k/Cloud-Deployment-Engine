output "instance_id" {
  description = "EC2 instance ID"
  value       = module.server_instance.instance_id
}

output "private_ip" {
  description = "Private IP address of the node in the private subnet"
  value       = module.server_instance.private_ip
}

output "public_ip" {
  description = "Public IP address (blank for private nodes, preserved for backward compatibility)"
  value       = module.server_instance.public_ip
}

output "private_dns" {
  description = "Private DNS name"
  value       = module.server_instance.private_dns
}

output "is_control_plane" {
  description = "Whether this node is running as K3s Server (control plane)"
  value       = module.server_instance.is_control_plane
}

output "node_role" {
  description = "Cluster role of this node (SERVER or AGENT)"
  value       = module.server_instance.node_role
}

output "instance_name" {
  description = "Name tag assigned to this instance"
  value       = module.server_instance.instance_name
}
