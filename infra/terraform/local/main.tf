terraform {
  required_version = ">= 1.5"

  required_providers {
    kind = {
      source  = "tehcyx/kind"
      version = "~> 0.4"
    }
    null = {
      source  = "hashicorp/null"
      version = "~> 3.2"
    }
  }
}

provider "kind" {}

resource "kind_cluster" "autoservice" {
  name = var.cluster_name

  node_image = var.node_image

  kind_config {
    kind        = "Cluster"
    api_version = "kind.x-k8s.io/v1alpha4"
    role        = "control-plane"
    extra_port_mappings {
      container_port = 30080
      host_port      = 30080
      protocol       = "TCP"
    }
  }
}

resource "null_resource" "database_compose" {
  triggers = {
    compose_hash = filemd5("${path.module}/../../../docker-compose.db.yml")
  }

  provisioner "local-exec" {
    command     = "docker compose -f ${path.module}/../../../docker-compose.db.yml up -d"
    working_dir = abspath("${path.module}/../../..")
  }

  provisioner "local-exec" {
    when        = destroy
    command     = "docker compose -f ${path.module}/../../../docker-compose.db.yml down"
    working_dir = abspath("${path.module}/../../..")
  }
}
