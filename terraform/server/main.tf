terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

data "terraform_remote_state" "base" {
  backend = "local"

  config = {
    path = "../base/terraform.tfstate"
  }
}

locals {
  subnet_id                 = var.subnet_id != "" ? var.subnet_id : try(data.terraform_remote_state.base.outputs.public_subnet_1_id, data.terraform_remote_state.base.outputs.public_subnet_ids[0], "")
  security_group_id         = var.security_group_id != "" ? var.security_group_id : try(data.terraform_remote_state.base.outputs.node_security_group_id, data.terraform_remote_state.base.outputs.security_group_id, "")
  iam_instance_profile_name = var.iam_instance_profile_name != "" ? var.iam_instance_profile_name : (var.is_control_plane ? try(data.terraform_remote_state.base.outputs.server_iam_instance_profile_name, "") : try(data.terraform_remote_state.base.outputs.agent_iam_instance_profile_name, ""))
  ssm_parameter_name        = var.ssm_parameter_name != "" ? var.ssm_parameter_name : try(data.terraform_remote_state.base.outputs.ssm_parameter_name, "/kubedeploy/k3s-join-token")
}

module "server_instance" {
  source                    = "../modules/server"
  aws_region                = var.aws_region
  key_name                  = var.key_name
  instance_type             = var.instance_type
  instance_name             = var.instance_name != "" ? var.instance_name : terraform.workspace
  subnet_id                 = local.subnet_id
  security_group_id         = local.security_group_id
  is_control_plane          = var.is_control_plane
  k3s_server_private_ip     = var.k3s_server_private_ip
  iam_instance_profile_name = local.iam_instance_profile_name
  ssm_parameter_name        = local.ssm_parameter_name
}
