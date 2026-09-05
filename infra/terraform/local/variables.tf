variable "cluster_name" {
  description = "Nome do cluster kind"
  type        = string
  default     = "autoservice-local"
}

variable "node_image" {
  description = "Imagem do node kind (Kubernetes)"
  type        = string
  default     = "kindest/node:v1.32.2"
}
