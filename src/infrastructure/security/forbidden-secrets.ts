/** Known local/demo secrets — must not be used in production (V6.1). */
export const FORBIDDEN_JWT_SECRETS = [
  'change-me-min-16-chars',
  'docker-compose-dev-jwt-secret-min-16-chars',
  'local-k8s-jwt-secret-min-16-chars',
  'dev-secret-min-16-chars',
] as const;

export const FORBIDDEN_WEBHOOK_SECRETS = [
  'docker-compose-dev-webhook-secret-min-16',
] as const;

export function isForbiddenDatabaseUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return (
    lower.includes('@localhost') ||
    lower.includes('app:appsecret@') ||
    lower.includes('root:rootsecret@')
  );
}
