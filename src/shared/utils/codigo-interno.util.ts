/** Normaliza código interno de peça (trim + maiúsculas). */
export function normalizeCodigoInterno(value: string): string {
  return value.trim().toUpperCase();
}
