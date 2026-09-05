import {
  isValidCnpj,
  isValidCpf,
  isValidCpfCnpj,
  onlyDigits,
} from './cpf-cnpj';

describe('cpf-cnpj', () => {
  it('normaliza dígitos', () => {
    expect(onlyDigits('123.456.789-01')).toBe('12345678901');
  });

  it('valida CPF conhecido', () => {
    expect(isValidCpf('52998224725')).toBe(true);
    expect(isValidCpfCnpj('52998224725')).toBe(true);
  });

  it('rejeita CPF inválido', () => {
    expect(isValidCpf('11111111111')).toBe(false);
    expect(isValidCpfCnpj('11111111111')).toBe(false);
  });

  it('valida CNPJ conhecido', () => {
    expect(isValidCnpj('11222333000181')).toBe(true);
    expect(isValidCpfCnpj('11222333000181')).toBe(true);
  });

  it('rejeita CNPJ com todos dígitos iguais', () => {
    expect(isValidCnpj('11111111111111')).toBe(false);
  });

  it('rejeita CNPJ com dígitos verificadores inválidos', () => {
    expect(isValidCpfCnpj('12345678000100')).toBe(false);
  });

  it('rejeita string com tamanho != 11 e != 14', () => {
    expect(isValidCpfCnpj('123')).toBe(false);
    expect(isValidCpfCnpj('1234567890')).toBe(false);
    expect(isValidCpfCnpj('123456789012345')).toBe(false);
  });

  it('rejeita CPF com primeiro dígito verificador inválido', () => {
    expect(isValidCpfCnpj('52998224735')).toBe(false);
  });

  it('rejeita CPF com segundo dígito verificador inválido', () => {
    expect(isValidCpfCnpj('52998224726')).toBe(false);
  });

  it('valida CNPJ do seed (12345678000195)', () => {
    expect(isValidCpfCnpj('12345678000195')).toBe(true);
  });

  it('rejeita string vazia', () => {
    expect(isValidCpfCnpj('')).toBe(false);
  });

  it('isValidCpf rejeita CNPJ por tamanho', () => {
    expect(isValidCpf('11222333000181')).toBe(false);
  });
});
