/** Remove espaços e hífens; converte para maiúsculas. */
export function normalizePlaca(value: string): string {
  return value.replace(/[\s-]/g, '').toUpperCase();
}

/** Padrão antigo LLLNNNN ou Mercosul LLLNLNN. */
export function isValidPlaca(normalized: string): boolean {
  if (normalized.length !== 7) return false;
  const oldPattern = /^[A-Z]{3}[0-9]{4}$/;
  const mercosulPattern = /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/;
  return oldPattern.test(normalized) || mercosulPattern.test(normalized);
}
