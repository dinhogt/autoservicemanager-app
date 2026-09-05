/**
 * Integração leve: validação pública + caso de uso de consulta,
 * sem subir HTTP nem banco (repositório mockado).
 */
import { StatusOs } from '@prisma/client';
import { ConsultarStatusOsUseCase } from '../../src/application/atendimento/use-cases/consultar-status-os.use-case';
import { mockOrdemServicoRepository } from '../helpers/mock-ordem-servico.repository';

describe('Atendimento público (integração)', () => {
  it('consulta status com CPF válido e OS existente', async () => {
    const os = {
      id: 'os-1',
      status: StatusOs.EM_DIAGNOSTICO,
      total: null,
      dataCriacao: new Date(),
      dataConclusao: null,
      dataEntrega: null,
      cliente: { id: 'c1', nome: 'Maria', cpfCnpj: '52998224725' },
      veiculo: {
        id: 'v1',
        placa: 'ABC1D23',
        modelo: 'Hatch',
      },
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
