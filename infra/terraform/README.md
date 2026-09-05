# Terraform — AutoServiceManager

Provisiona infraestrutura para a Fase 2 do Tech Challenge.

## Ambientes

| Path | Destino | Recursos |
|------|---------|----------|
| [`local/`](local/) | **Demo acadêmica (kind)** | Cluster kind + MySQL/Mongo via docker-compose |
| [`environments/dev/`](environments/dev/) | AWS (alternativo) | VPC, EKS, RDS MySQL, ECR, Secrets Manager |

Para demonstração local, comece por [`local/README.md`](local/README.md).

---

# Terraform — AutoServiceManager (AWS)

Provisiona VPC, EKS, RDS MySQL, ECR e Secrets Manager para a Fase 2 (path cloud).

## Recursos criados

| Módulo | Recursos |
|--------|----------|
| `vpc` | VPC, subnets públicas/privadas, NAT, IGW, route tables |
| `eks` | Cluster EKS, node group, IAM roles, security group dos nodes |
| `rds` | RDS MySQL 8, subnet group, security group (3306 a partir dos nodes) |
| `secrets` | Secrets Manager (DATABASE_URL, JWT, WEBHOOK, SMTP) + repositório ECR |

## Pré-requisitos

- Terraform >= 1.5
- AWS CLI configurado (`aws configure`)
- Permissões IAM para VPC, EKS, RDS, ECR, Secrets Manager

## Bootstrap do state remoto (opcional, recomendado)

```bash
aws s3 mb s3://autoservice-terraform-state --region us-east-1
aws dynamodb create-table \
  --table-name autoservice-terraform-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST
```

Adicione backend S3 em `environments/dev/backend.tf` antes do apply em equipe.

## Apply (ambiente dev)

```bash
cd infra/terraform/environments/dev
cp terraform.tfvars.example terraform.tfvars
# Edite terraform.tfvars com senhas fortes

terraform init
terraform plan
terraform apply
```

## Outputs úteis

```bash
terraform output eks_cluster_name
terraform output ecr_repository_url
terraform output rds_endpoint
```

## Destroy (evitar custos após demo)

```bash
terraform destroy
```

**Atenção:** EKS + RDS + NAT Gateway geram custo contínuo. Destrua o ambiente quando não estiver em uso.

## Integração com Kubernetes

Após o apply:

```bash
aws eks update-kubeconfig --region us-east-1 --name $(terraform output -raw eks_cluster_name)
kubectl apply -f ../../../../k8s/
```

Sincronize secrets do Secrets Manager para K8s (manual ou External Secrets Operator) antes do primeiro deploy da API.
