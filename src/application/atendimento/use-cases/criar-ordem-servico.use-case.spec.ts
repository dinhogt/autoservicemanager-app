import { BadRequestException, NotFoundException } from '@nestjs/common';
import { StatusOs } from '../../../domain/atendimento/value-objects/status-os.enum';
import { OsDomainEventType } from '../../../domain/atendimento/events/os-domain-events';
import type { OsMongoAuditPort } from '../../../domain/atendimento/ports';
import { Cliente } from '../../../domain/cadastro/entities/cliente.entity';
import type { ClienteRepository } from '../../../domain/cadastro/repositories/cliente.repository';
import { Veiculo } from '../../../domain/cadastro/entities/veiculo.entity';
import type { VeiculoRepository } from '../../../domain/cadastro/repositories/veiculo.repository';
import { ServicoCatalogo } from '../../../domain/catalogo-servicos/entities/servico-catalogo.entity';
import type { ServicoCatalogoRepository } from '../../../domain/catalogo-servicos/repositories/servico-catalogo.repository';
import { PecaEstoque } from '../../../domain/estoque/entities/peca-estoque.entity';
import type { PecaEstoqueRepository } from '../../../domain/estoque/repositories/peca-estoque.repository';
import { mockOrdemServicoRepository } from '../../../../test/helpers/mock-ordem-servico.repository';
import { CriarOrdemServicoUseCase } from './criar-ordem-servico.use-case';

describe('CriarOrdemServicoUseCase', () => {
  const now = new Date();
  const recordOsTransition = jest.fn().mockResolvedValue(undefined);
  const audit: OsMongoAuditPort = {
    recordDomainEvent: jest.fn(),
    recordStatusChange: jest.fn(),
    recordNotification: jest.fn(),
    recordOsTransition,
    listHistorico: jest.fn(),
  };

  const cliente = new Cliente(
    'c1',
    'João',
    '52998224725',
    null,
    null,
    true,
    now,
    now,
  );
  const veiculo = new Veiculo(
    'v1',
    'c1',
    'ABC1D23',
    null,
    null,
    null,
    true,
    now,
    now,
  );

  const createdOs = {
    id: 'os-new',
    clienteId: 'c1',
    veiculoId: 'v1',
    status: StatusOs.RECEBIDA,
    cliente: { id: 'c1', nome: 'João' },
    veiculo: { id: 'v1', placa: 'ABC1D23' },
    itensServico: [],
    itensPeca: [],
  };

  function makeUseCase(deps: {
    clientes?: Partial<ClienteRepository>;
    veiculos?: Partial<VeiculoRepository>;
    servicos?: Partial<ServicoCatalogoRepository>;
    pecas?: Partial<PecaEstoqueRepository>;
    ordensOverrides?: Record<string, jest.Mock>;
  }) {
    const clientes = {
      findById: jest.fn().mockResolvedValue(cliente),
      ...deps.clientes,
    } as unknown as ClienteRepository;
    const veiculos = {
      findById: jest.fn().mockResolvedValue(veiculo),
      ...deps.veiculos,
    } as unknown as VeiculoRepository;
    const servicosCatalogo = {
      findActiveByIds: jest.fn().mockResolvedValue([]),
      ...deps.servicos,
    } as unknown as ServicoCatalogoRepository;
    const pecasEstoque = {
      findActiveByIds: jest.fn().mockResolvedValue([]),
      ...deps.pecas,
    } as unknown as PecaEstoqueRepository;
    const ordens = mockOrdemServicoRepository({
      createWithItems: jest.fn().mockResolvedValue(createdOs),
      ...deps.ordensOverrides,
    });
    return new CriarOrdemServicoUseCase(
      clientes,
      veiculos,
      servicosCatalogo,
      pecasEstoque,
      ordens,
      audit,
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('404 quando cliente não existe', async () => {
    const uc = makeUseCase({
      clientes: { findById: jest.fn().mockResolvedValue(null) },
    });
    await expect(
      uc.execute({ clienteId: 'x', veiculoId: 'v1' } as never),
    ).rejects.toThrow(NotFoundException);
  });

  it('404 quando veículo não existe', async () => {
    const uc = makeUseCase({
      veiculos: { findById: jest.fn().mockResolvedValue(null) },
    });
    await expect(
      uc.execute({ clienteId: 'c1', veiculoId: 'x' } as never),
    ).rejects.toThrow(NotFoundException);
  });

  it('400 quando veículo não pertence ao cliente', async () => {
    const uc = makeUseCase({
      veiculos: {
        findById: jest
          .fn()
          .mockResolvedValue(
            new Veiculo(
              'v1',
              'outro',
              'ABC1D23',
              null,
              null,
              null,
              true,
              now,
              now,
            ),
          ),
      },
    });
    await expect(
      uc.execute({ clienteId: 'c1', veiculoId: 'v1' } as never),
    ).rejects.toThrow(BadRequestException);
  });

  it('400 quando serviço do catálogo não existe', async () => {
    const uc = makeUseCase({
      servicos: { findActiveByIds: jest.fn().mockResolvedValue([]) },
    });
    await expect(
      uc.execute({
        clienteId: 'c1',
        veiculoId: 'v1',
        itensServico: [{ servicoCatalogoId: 's-missing', quantidade: 1 }],
      } as never),
    ).rejects.toThrow(BadRequestException);
  });

  it('400 quando peça não existe', async () => {
    const uc = makeUseCase({
      pecas: { findActiveByIds: jest.fn().mockResolvedValue([]) },
    });
    await expect(
      uc.execute({
        clienteId: 'c1',
        veiculoId: 'v1',
        itensPeca: [{ pecaEstoqueId: 'p-missing', quantidade: 1 }],
      } as never),
    ).rejects.toThrow(BadRequestException);
  });

  it('cria OS vazia, audita e retorna agregado', async () => {
    const createWithItems = jest.fn().mockResolvedValue(createdOs);
    const uc = makeUseCase({ ordensOverrides: { createWithItems } });

    const result = await uc.execute({
      clienteId: 'c1',
      veiculoId: 'v1',
    } as never);

    expect(result.id).toBe('os-new');
    expect(createWithItems).toHaveBeenCalledWith(
      expect.objectContaining({
        clienteId: 'c1',
        veiculoId: 'v1',
        total: 0,
      }),
    );
    expect(recordOsTransition).toHaveBeenCalledWith({
      ordemServicoId: 'os-new',
      domainEvent: {
        eventType: OsDomainEventType.OsCriada,
        payload: { clienteId: 'c1', veiculoId: 'v1' },
      },
      fromStatus: null,
      toStatus: StatusOs.RECEBIDA,
      context: 'CriarOrdemServico',
    });
  });

  it('400 quando cliente está inativo', async () => {
    const uc = makeUseCase({
      clientes: {
        findById: jest
          .fn()
          .mockResolvedValue(
            new Cliente(
              'c1',
              'João',
              '52998224725',
              null,
              null,
              false,
              now,
              now,
            ),
          ),
      },
    });
    await expect(
      uc.execute({ clienteId: 'c1', veiculoId: 'v1' } as never),
    ).rejects.toThrow(BadRequestException);
  });

  it('400 quando veículo está inativo', async () => {
    const uc = makeUseCase({
      veiculos: {
        findById: jest
          .fn()
          .mockResolvedValue(
            new Veiculo(
              'v1',
              'c1',
              'ABC1D23',
              null,
              null,
              null,
              false,
              now,
              now,
            ),
          ),
      },
    });
    await expect(
      uc.execute({ clienteId: 'c1', veiculoId: 'v1' } as never),
    ).rejects.toThrow(BadRequestException);
  });

  it('cria OS com itens (serviços+peças) e calcula total', async () => {
    const createWithItems = jest.fn().mockResolvedValue({
      ...createdOs,
      id: 'os-2',
    });
    const uc = makeUseCase({
      servicos: {
        findActiveByIds: jest
          .fn()
          .mockResolvedValue([
            new ServicoCatalogo('s1', 'Serv', 100, 60, true, now, now),
          ]),
      },
      pecas: {
        findActiveByIds: jest
          .fn()
          .mockResolvedValue([
            new PecaEstoque('p1', 'Peca', 10, 5, 'P1', true, now, now),
          ]),
      },
      ordensOverrides: { createWithItems },
    });
    await uc.execute({
      clienteId: 'c1',
      veiculoId: 'v1',
      itensServico: [
        { servicoCatalogoId: 's1', quantidade: 1 },
        { servicoCatalogoId: 's1', quantidade: 2 },
      ],
      itensPeca: [{ pecaEstoqueId: 'p1', quantidade: 3 }],
    } as never);

    expect(createWithItems).toHaveBeenCalledWith(
      expect.objectContaining({
        total: 330,
        itensServico: [
          expect.objectContaining({
            servicoCatalogoId: 's1',
            quantidade: 3,
          }),
        ],
        itensPeca: [
          expect.objectContaining({ pecaEstoqueId: 'p1', quantidade: 3 }),
        ],
      }),
    );
  });
});
