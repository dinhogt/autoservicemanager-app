resource "aws_secretsmanager_secret" "app" {
  name = "${var.name}/app-secrets"
  tags = var.tags
}

resource "aws_secretsmanager_secret_version" "app" {
  secret_id = aws_secretsmanager_secret.app.id
  secret_string = jsonencode({
    DATABASE_URL   = var.database_url
    JWT_SECRET     = var.jwt_secret
    WEBHOOK_SECRET = var.webhook_secret
    SMTP_HOST      = var.smtp_host
    SMTP_PORT      = var.smtp_port
    SMTP_USER      = var.smtp_user
    SMTP_PASS      = var.smtp_pass
    EMAIL_FROM     = var.email_from
  })
}

resource "aws_ecr_repository" "api" {
  name                 = "${var.name}-api"
  image_tag_mutability = "MUTABLE"
  force_delete         = true
  tags                 = var.tags
}
