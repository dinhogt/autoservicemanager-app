#!/usr/bin/env bash
# Cria 4 IAM roles OIDC (1 por repo). NÃO executa terraform apply.
# Requer: AWS CLI com permissão iam:CreateRole / AttachRolePolicy / GetOpenIDConnectProvider
# Uso: AWS_PROFILE=admin ./scripts/create-oidc-roles.sh
set -euo pipefail

ACCOUNT_ID="${AWS_ACCOUNT_ID:-975769101856}"
OIDC_PROVIDER="arn:aws:iam::${ACCOUNT_ID}:oidc-provider/token.actions.githubusercontent.com"
REGION="${AWS_REGION:-us-east-1}"

create_role() {
  local name="$1"
  local repo="$2"
  local managed_policies="$3"

  local trust
  trust=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Federated": "${OIDC_PROVIDER}" },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": {
        "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
      },
      "StringLike": {
        "token.actions.githubusercontent.com:sub": "repo:dinhogt/${repo}:*"
      }
    }
  }]
}
EOF
)

  if aws iam get-role --role-name "$name" >/dev/null 2>&1; then
    echo "Updating trust on existing role $name"
    aws iam update-assume-role-policy --role-name "$name" --policy-document "$trust"
  else
    echo "Creating role $name for repo $repo"
    aws iam create-role \
      --role-name "$name" \
      --assume-role-policy-document "$trust" \
      --description "GitHub OIDC CD for dinhogt/${repo}" \
      >/dev/null
  fi

  for p in $managed_policies; do
    aws iam attach-role-policy --role-name "$name" --policy-arn "$p" 2>/dev/null || true
  done

  aws iam get-role --role-name "$name" --query 'Role.Arn' --output text
}

echo "Ensure OIDC provider exists for token.actions.githubusercontent.com (create once in console if missing)."

# Policies are intentionally broad for academic lab; tighten before production use.
POWER="arn:aws:iam::aws:policy/PowerUserAccess"
# Prefer custom least-privilege in real prod; PowerUser is a bootstrap shortcut for FIAP lab.

echo "=== app ==="
create_role "gha-autoservicemanager-app" "autoservicemanager-app" "$POWER"
echo "=== auth-lambda ==="
create_role "gha-autoservicemanager-auth-lambda" "autoservicemanager-auth-lambda" "$POWER"
echo "=== infra-db ==="
create_role "gha-autoservicemanager-infra-db" "autoservicemanager-infra-db" "$POWER"
echo "=== infra-k8s ==="
create_role "gha-autoservicemanager-infra-k8s" "autoservicemanager-infra-k8s" "$POWER"

echo
echo "Next: set each ARN as GitHub Actions secret AWS_ROLE_ARN on homolog+production for that repo."
echo "Then (only when approved): terraform apply in infra-db → infra-k8s."
