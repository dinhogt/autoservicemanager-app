output "secret_arn" {
  value = aws_secretsmanager_secret.app.arn
}

output "ecr_repository_url" {
  value = aws_ecr_repository.api.repository_url
}
