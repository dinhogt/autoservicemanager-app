import { DomainException } from '../../../shared/errors/domain.exception';
import { Placa } from './placa.vo';

describe('Placa', () => {
  it('create aceita padrão antigo', () => {
    expect(Placa.create('abc-1234').value).toBe('ABC1234');
  });

  it('create aceita Mercosul', () => {
    expect(Placa.create('abc1d23').value).toBe('ABC1D23');
  });

  it('create lança para placa inválida', () => {
    expect(() => Placa.create('AB')).toThrow(DomainException);
  });

  it('fromStored não valida', () => {
    expect(Placa.fromStored('ABC1D23').value).toBe('ABC1D23');
  });
});
