const SENSITIVE_KEY =
  /"(password|senha|token|authorization|secret|smtp_pass|webhook_secret|jwt_secret|database_url)"\s*:\s*"[^"]*"/gi;
const CPF_DIGITS = /\b(\d{3})\d{6}(\d{2})\b/g;

/** Masks common secret/PII patterns in log strings without dropping the event. */
export function redactLogText(text: string): string {
  return text
    .replace(SENSITIVE_KEY, '"$1":"[REDACTED]"')
    .replace(CPF_DIGITS, '$1******$2');
}

export function redactLogValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return redactLogText(value);
  }
  if (value !== null && typeof value === 'object') {
    return JSON.parse(redactLogText(JSON.stringify(value)));
  }
  return value;
}
