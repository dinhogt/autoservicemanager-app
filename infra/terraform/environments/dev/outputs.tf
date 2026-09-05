output "eks_cluster_name" {
  value = module.eks.cluster_name
}

output "rds_endpoint" {
  value = module.rds.endpoint
}

output "ecr_repository_url" {
  value = module.secrets.ecr_repository_url
}

output "secrets_manager_arn" {
  value     = module.secrets.secret_arn
  sensitive = true
}
