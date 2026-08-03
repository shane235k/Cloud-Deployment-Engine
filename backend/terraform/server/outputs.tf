output "public_ip" {
  description = "Public IP address"
  value       = module.server_instance.public_ip
}

output "instance_id" {
  description = "EC2 instance ID"
  value       = module.server_instance.instance_id
}

output "public_dns" {
  description = "Public DNS name"
  value       = module.server_instance.public_dns
}
