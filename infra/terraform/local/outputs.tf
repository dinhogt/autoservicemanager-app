output "cluster_name" {
  description = "Nome do cluster kind provisionado"
  value       = kind_cluster.autoservice.name
}

output "next_steps" {
  description = "Comandos após terraform apply"
  value       = <<-EOT
    1. ./scripts/kind-setup.sh
    2. API: http://localhost:30080/api-docs
    3. Smoke test: BASE_URL=http://localhost:30080 ./scripts/smoke-test-apis.sh
  EOT
}
