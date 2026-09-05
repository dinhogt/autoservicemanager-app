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

locals {
  name = var.project_name
  tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

module "vpc" {
  source = "../../modules/vpc"

  name                  = local.name
  vpc_cidr              = var.vpc_cidr
  availability_zones    = var.availability_zones
  public_subnet_cidrs   = var.public_subnet_cidrs
  private_subnet_cidrs  = var.private_subnet_cidrs
  single_nat_gateway    = var.single_nat_gateway
  tags                  = local.tags
}

module "eks" {
  source = "../../modules/eks"

  name         = local.name
  vpc_id       = module.vpc.vpc_id
  subnet_ids   = module.vpc.private_subnet_ids
  desired_size = var.eks_desired_size
  min_size     = var.eks_min_size
  max_size     = var.eks_max_size
  tags         = local.tags
}

module "rds" {
  source = "../../modules/rds"

  name                       = local.name
  vpc_id                     = module.vpc.vpc_id
  subnet_ids                 = module.vpc.private_subnet_ids
  allowed_security_group_ids = [module.eks.node_security_group_id]
  master_username            = var.db_username
  master_password            = var.db_password
  database_name              = var.db_name
  tags                       = local.tags
}

module "secrets" {
  source = "../../modules/secrets"

  name           = local.name
  database_url   = "mysql://${var.db_username}:${var.db_password}@${module.rds.endpoint}:${module.rds.port}/${var.db_name}"
  jwt_secret     = var.jwt_secret
  webhook_secret = var.webhook_secret
  smtp_host      = var.smtp_host
  smtp_user      = var.smtp_user
  smtp_pass      = var.smtp_pass
  email_from     = var.email_from
  tags           = local.tags
}
