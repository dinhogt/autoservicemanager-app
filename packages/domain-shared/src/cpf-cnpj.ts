/** Remove caracteres não numéricos. */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

function isCpfRepeated(digits: string): boolean {
  return /^(\d)\1{10}$/.test(digits);
}

function validateCpfDigits(digits: string): boolean {
  if (digits.length !== 11 || isCpfRepeated(digits)) {
    return false;
  }
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i], 10) * (10 - i);
  }
  let rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(digits[9], 10)) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits[i], 10) * (11 - i);
  }
  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  return rest === parseInt(digits[10], 10);
}

function validateCnpjDigits(digits: string): boolean {
  if (digits.length !== 14 || /^(\d)\1{13}$/.test(digits)) {
    return false;
  }
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(digits[i], 10) * weights1[i];
  }
  let rest = sum % 11;
  const d1 = rest < 2 ? 0 : 11 - rest;
  if (d1 !== parseInt(digits[12], 10)) return false;
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(digits[i], 10) * weights2[i];
  }
  rest = sum % 11;
  const d2 = rest < 2 ? 0 : 11 - rest;
  return d2 === parseInt(digits[13], 10);
}

/** Valida CPF (11 dígitos) após normalização. */
export function isValidCpf(normalizedDigits: string): boolean {
  return normalizedDigits.length === 11 && validateCpfDigits(normalizedDigits);
}

/** Valida CNPJ (14 dígitos) após normalização. */
export function isValidCnpj(normalizedDigits: string): boolean {
  return normalizedDigits.length === 14 && validateCnpjDigits(normalizedDigits);
}

/** Valida CPF (11 dígitos) ou CNPJ (14 dígitos) após normalização. */
export function isValidCpfCnpj(normalizedDigits: string): boolean {
  if (normalizedDigits.length === 11) {
    return validateCpfDigits(normalizedDigits);
  }
  if (normalizedDigits.length === 14) {
    return validateCnpjDigits(normalizedDigits);
  }
  return false;
}
