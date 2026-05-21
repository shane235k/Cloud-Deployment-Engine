output "public_ip" {
  description = "Public IP address"
  value       = aws_eip.kubedeploy_ip.public_ip
}

output "instance_id" {
  description = "EC2 instance ID"
  value       = aws_instance.kubedeploy.id
}

output "public_dns" {
  description = "Public DNS name"
  value       = aws_instance.kubedeploy.public_dns
}