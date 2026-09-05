import type { OrdemServicoRepository } from '../../src/domain/atendimento/repositories/ordem-servico.repository';

export function mockOrdemServicoRepository(
  overrides: Partial<{
    [K in keyof OrdemServicoRepository]: jest.Mock;
  }> = {},
): OrdemServicoRepository {
  return {
    findById: jest.fn(),
    findWithClienteVeiculoById: jest.fn(),
    findDetailedById: jest.fn(),
    listarAtivasParaPainel: jest.fn(),
    countAtivasParaPainel: jest.fn(),
    save: jest.fn(),
    updateStatus: jest.fn(),
    createWithItems: jest.fn(),
    finalizar: jest.fn(),
    aprovarOrcamentoComReserva: jest.fn(),
    rejeitarOrcamento: jest.fn(),
    findForGerarOrcamento: jest.fn(),
    gerarOrcamento: jest.fn(),
    ...overrides,
  } as unknown as OrdemServicoRepository;
}
