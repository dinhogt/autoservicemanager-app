import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CLIENTE_REPOSITORY } from '../../../domain/cadastro/repositories/cliente.repository';
import type { ClienteRepository } from '../../../domain/cadastro/repositories/cliente.repository';
import { VEICULO_REPOSITORY } from '../../../domain/cadastro/repositories/veiculo.repository';
import type { VeiculoRepository } from '../../../domain/cadastro/repositories/veiculo.repository';
import { SERVICO_CATALOGO_REPOSITORY } from '../../../domain/catalogo-servicos/repositories/servico-catalogo.repository';
import type { ServicoCatalogoRepository } from '../../../domain/catalogo-servicos/repositories/servico-catalogo.repository';
import { PECA_ESTOQUE_REPOSITORY } from '../../../domain/estoque/repositories/peca-estoque.repository';
import type { PecaEstoqueRepository } from '../../../domain/estoque/repositories/peca-estoque.repository';
import { CreateOrdemServicoDto } from '../dto/create-ordem-servico.dto';
import { OsDomainEventType } from '../../../domain/atendimento/events/os-domain-events';
import { OS_MONGO_AUDIT } from '../../../domain/atendimento/ports';
import type { OsMongoAuditPort } from '../../../domain/atendimento/ports';
import { ORDEM_SERVICO_REPOSITORY } from '../../../domain/atendimento/repositories/ordem-servico.repository';
import type { OrdemServicoRepository } from '../../../domain/atendimento/repositories/ordem-servico.repository';

@Injectable()
export class CriarOrdemServicoUseCase {
  constructor(
    @Inject(CLIENTE_REPOSITORY)
    private readonly clientes: ClienteRepository,
    @Inject(VEICULO_REPOSITORY)
    private readonly veiculos: VeiculoRepository,
    @Inject(SERVICO_CATALOGO_REPOSITORY)
    private readonly servicosCatalogo: ServicoCatalogoRepository,
    @Inject(PECA_ESTOQUE_REPOSITORY)
    private readonly pecasEstoque: PecaEstoqueRepository,
    @Inject(ORDEM_SERVICO_REPOSITORY)
    private readonly ordens: OrdemServicoRepository,
    @Inject(OS_MONGO_AUDIT) private readonly audit: OsMongoAuditPort,
  ) {}

  async execute(dto: CreateOrdemServicoDto) {
    const cliente = await this.clientes.findById(dto.clienteId);
    if (!cliente) {
      throw new NotFoundException('Cliente não encontrado');
    }
    if (!cliente.ativo) {
      throw new BadRequestException('Cliente está inativo');
    }

    const veiculo = await this.veiculos.findById(dto.veiculoId);
    if (!veiculo) {
      throw new NotFoundException('Veículo não encontrado');
    }
    if (!veiculo.ativo) {
      throw new BadRequestException('Veículo está inativo');
    }
    if (veiculo.clienteId !== dto.clienteId) {
      throw new BadRequestException(
        'Veículo informado não pertence ao cliente informado',
      );
    }

    const itensServicoRaw = dto.itensServico ?? [];
    const itensPecaRaw = dto.itensPeca ?? [];

    const itensServico = this.mergeServicos(itensServicoRaw);
    const itensPeca = this.mergePecas(itensPecaRaw);

    const servicosIds = itensServico.map((i) => i.servicoCatalogoId);
    const pecasIds = itensPeca.map((i) => i.pecaEstoqueId);

    const servicos = await this.servicosCatalogo.findActiveByIds(servicosIds);
    const pecas = await this.pecasEstoque.findActiveByIds(pecasIds);

    if (servicos.length !== servicosIds.length) {
      throw new BadRequestException(
        'Um ou mais serviços informados não existem no catálogo (ou estão inativos)',
      );
    }
    if (pecas.length !== pecasIds.length) {
      throw new BadRequestException(
        'Uma ou mais peças informadas não existem no estoque (ou estão inativas)',
      );
    }

    const servicoMap = new Map(servicos.map((s) => [s.id, s.precoBase]));
    const pecaMap = new Map(pecas.map((p) => [p.id, p.precoUnitario]));

    let total = 0;
    for (const item of itensServico) {
      total += (servicoMap.get(item.servicoCatalogoId) ?? 0) * item.quantidade;
    }
    for (const item of itensPeca) {
      total += (pecaMap.get(item.pecaEstoqueId) ?? 0) * item.quantidade;
    }

    const created = await this.ordens.createWithItems({
      clienteId: dto.clienteId,
      veiculoId: dto.veiculoId,
      total,
      itensServico: itensServico.map((item) => ({
        servicoCatalogoId: item.servicoCatalogoId,
        quantidade: item.quantidade,
        precoAplicado: servicoMap.get(item.servicoCatalogoId) ?? 0,
      })),
      itensPeca: itensPeca.map((item) => ({
        pecaEstoqueId: item.pecaEstoqueId,
        quantidade: item.quantidade,
        precoUnitario: pecaMap.get(item.pecaEstoqueId) ?? 0,
      })),
    });

    await this.audit.recordOsTransition({
      ordemServicoId: created.id,
      domainEvent: {
        eventType: OsDomainEventType.OsCriada,
        payload: { clienteId: created.clienteId, veiculoId: created.veiculoId },
      },
      fromStatus: null,
      toStatus: created.status,
      context: 'CriarOrdemServico',
    });

    return created;
  }

  private mergeServicos(
    items: { servicoCatalogoId: string; quantidade: number }[],
  ): { servicoCatalogoId: string; quantidade: number }[] {
    const map = new Map<string, number>();
    for (const item of items) {
      map.set(
        item.servicoCatalogoId,
        (map.get(item.servicoCatalogoId) ?? 0) + item.quantidade,
      );
    }
    return [...map.entries()].map(([servicoCatalogoId, quantidade]) => ({
      servicoCatalogoId,
      quantidade,
    }));
  }

  private mergePecas(
    items: { pecaEstoqueId: string; quantidade: number }[],
  ): { pecaEstoqueId: string; quantidade: number }[] {
    const map = new Map<string, number>();
    for (const item of items) {
      map.set(
        item.pecaEstoqueId,
        (map.get(item.pecaEstoqueId) ?? 0) + item.quantidade,
      );
    }
    return [...map.entries()].map(([pecaEstoqueId, quantidade]) => ({
      pecaEstoqueId,
      quantidade,
    }));
  }
}
