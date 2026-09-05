import { isValidPlaca, normalizePlaca } from './placa';

describe('placa', () => {
  it('normalizePlaca remove espaços e hífen e coloca maiúsculas', () => {
    expect(normalizePlaca(' ab c-1d23 ')).toBe('ABC1D23');
  });

  it('isValidPlaca aceita formato antigo', () => {
    expect(isValidPlaca('ABC1234')).toBe(true);
  });

  it('isValidPlaca aceita Mercosul', () => {
    expect(isValidPlaca('ABC1D23')).toBe(true);
  });

  it('isValidPlaca rejeita tamanho diferente de 7', () => {
    expect(isValidPlaca('ABC123')).toBe(false);
  });

  it('isValidPlaca rejeita padrão inválido', () => {
    expect(isValidPlaca('ABCD123')).toBe(false);
  });
});
