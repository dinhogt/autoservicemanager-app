import { StatusOs } from '../../../domain/atendimento/value-objects/status-os.enum';
import { mockOrdemServicoRepository } from '../../../../test/helpers/mock-ordem-servico.repository';
import { ConsultarStatusOsUseCase } from './consultar-status-os.use-case';

describe('ConsultarStatusOsUseCase', () => {
  it('delega validação pública e retorna resumo', async () => {
    const os = {
      id: 'os-1',
      status: StatusOs.EM_DIAGNOSTICO,
      total: null,
      dataCriacao: new Date(),
      dataConclusao: null,
      dataEntrega: null,
      cliente: { id: 'c1', nome: 'Maria', cpfCnpj: '52998224725' },
      veiculo: { id: 'v1', placa: 'ABC1D23', modelo: 'Hatch' },
    };
    const ordens = mockOrdemServicoRepository({
      findWithClienteVeiculoById: jest.fn().mockResolvedValue(os),
    });
    const uc = new ConsultarStatusOsUseCase(ordens);
    const out = await uc.execute('os-1', { cpfCnpj: '529.982.247-25' });
    expect(out.status).toBe(StatusOs.EM_DIAGNOSTICO);
    expect(out.cliente.nome).toBe('Maria');
  });
});
