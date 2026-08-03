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

module "server_instance" {
  source            = "../modules/server"
  aws_region        = var.aws_region
  key_name          = var.key_name
  instance_type     = var.instance_type
  instance_name     = var.instance_name != "" ? var.instance_name : terraform.workspace
  security_group_id = data.terraform_remote_state.base.outputs.security_group_id
}
