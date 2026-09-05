import { DomainException } from '../../../shared/errors/domain.exception';
import { CpfCnpj } from './cpf-cnpj.vo';

describe('CpfCnpj', () => {
  it('create normaliza e valida CPF', () => {
    const vo = CpfCnpj.create('529.982.247-25');
    expect(vo.value).toBe('52998224725');
  });

  it('create valida CNPJ', () => {
    const vo = CpfCnpj.create('11.222.333/0001-81');
    expect(vo.value).toBe('11222333000181');
  });

  it('create lança DomainException para documento inválido', () => {
    expect(() => CpfCnpj.create('11111111111')).toThrow(DomainException);
  });

  it('fromStored não valida (valor já persistido)', () => {
    expect(CpfCnpj.fromStored('52998224725').value).toBe('52998224725');
  });
});
