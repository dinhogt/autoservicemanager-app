output "cluster_name" {
  value = aws_eks_cluster.this.name
}

output "cluster_endpoint" {
  value = aws_eks_cluster.this.endpoint
}

output "node_security_group_id" {
  value = aws_security_group.nodes.id
}

output "oidc_provider_arn" {
  value = aws_eks_cluster.this.arn
}
