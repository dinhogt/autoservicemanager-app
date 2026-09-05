import { Injectable } from '@nestjs/common';
import { Prisma, StatusOs as PrismaStatusOs } from '@prisma/client';
import { OrdemServico } from '../../../../domain/atendimento/entities/ordem-servico.entity';
import { StatusOs } from '../../../../domain/atendimento/value-objects/status-os.enum';
import {
  statusOsToDomain,
  statusOsToPrisma,
} from '../mappers/status-os.mapper';
import {
  CreateOrdemServicoInput,
  OrdemServicoRepository,
  UpdateOrdemServicoStatusInput,
} from '../../../../domain/atendimento/repositories/ordem-servico.repository';
import {
  OrdemServicoComClienteVeiculo,
  OrdemServicoPainelItem,
} from '../../../../domain/atendimento/types/ordem-servico-read.types';
import { reservarPecasNaoReservadasDaOs } from '../reservar-pecas-aprovacao-orcamento';
import { PrismaService } from '../prisma.service';

const EXCLUDED_FROM_PAINEL = [StatusOs.FINALIZADA, StatusOs.ENTREGUE].map(
  statusOsToPrisma,
);

const clienteVeiculoInclude = { cliente: true, veiculo: true } as const;

@Injectable()
export class PrismaOrdemServicoRepository implements OrdemServicoRepository {
  constructor(private readonly prisma: PrismaService) {}

  private map(row: {
    id: string;
    clienteId: string;
    veiculoId: string;
    status: PrismaStatusOs;
    total: unknown;
    dataCriacao: Date;
    dataConclusao: Date | null;
    dataEntrega: Date | null;
  }): OrdemServico {
    return new OrdemServico(
      row.id,
      row.clienteId,
      row.veiculoId,
      statusOsToDomain(row.status),
      row.total != null ? Number(row.total) : null,
      row.dataCriacao,
      row.dataConclusao,
      row.dataEntrega,
    );
  }

  private mapPainel(
    row: Prisma.OrdemServicoGetPayload<{
      include: typeof clienteVeiculoInclude;
    }>,
  ): OrdemServicoPainelItem {
    return {
      id: row.id,
      status: statusOsToDomain(row.status),
      total: row.total != null ? Number(row.total) : null,
      dataCriacao: row.dataCriacao,
      cliente: { id: row.cliente.id, nome: row.cliente.nome },
      veiculo: {
        id: row.veiculo.id,
        placa: row.veiculo.placa,
        modelo: row.veiculo.modelo,
      },
    };
  }

  async findById(id: string): Promise<OrdemServico | null> {
    const row = await this.prisma.ordemServico.findUnique({ where: { id } });
    return row ? this.map(row) : null;
  }

  async findWithClienteVeiculoById(
    id: string,
  ): Promise<OrdemServicoComClienteVeiculo | null> {
    const row = await this.prisma.ordemServico.findUnique({
      where: { id },
      include: clienteVeiculoInclude,
    });
    return row ? this.mapComClienteVeiculo(row) : null;
  }

  private mapComClienteVeiculo(
    row: Prisma.OrdemServicoGetPayload<{
      include: typeof clienteVeiculoInclude;
    }>,
  ): OrdemServicoComClienteVeiculo {
    return {
      ...row,
      status: statusOsToDomain(row.status),
      total: row.total != null ? Number(row.total) : null,
    };
  }

  async findDetailedById(id: string): Promise<Record<string, unknown> | null> {
    return this.prisma.ordemServico.findUnique({
      where: { id },
      include: {
        cliente: true,
        veiculo: true,
        itensServico: { include: { servicoCatalogo: true } },
        itensPeca: { include: { pecaEstoque: true } },
      },
    });
  }

  async listarAtivasParaPainel(params: {
    skip: number;
    take: number;
  }): Promise<OrdemServicoPainelItem[]> {
    const ids = await this.prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM OrdemServico
      WHERE status NOT IN (${statusOsToPrisma(StatusOs.FINALIZADA)}, ${statusOsToPrisma(StatusOs.ENTREGUE)})
      ORDER BY
        CASE status
          WHEN ${statusOsToPrisma(StatusOs.EM_EXECUCAO)} THEN 1
          WHEN ${statusOsToPrisma(StatusOs.AGUARDANDO_APROVACAO)} THEN 2
          WHEN ${statusOsToPrisma(StatusOs.EM_DIAGNOSTICO)} THEN 3
          WHEN ${statusOsToPrisma(StatusOs.RECEBIDA)} THEN 4
          ELSE 5
        END ASC,
        dataCriacao ASC
      LIMIT ${params.take} OFFSET ${params.skip}
    `;

    if (ids.length === 0) {
      return [];
    }

    const rows = await this.prisma.ordemServico.findMany({
      where: { id: { in: ids.map((r) => r.id) } },
      include: clienteVeiculoInclude,
    });

    const byId = new Map(rows.map((r) => [r.id, r]));
    return ids
      .map(({ id }) => byId.get(id))
      .filter((r): r is NonNullable<typeof r> => r != null)
      .map((r) => this.mapPainel(r));
  }

  async countAtivasParaPainel(): Promise<number> {
    return this.prisma.ordemServico.count({
      where: { status: { notIn: EXCLUDED_FROM_PAINEL } },
    });
  }

  async save(os: OrdemServico): Promise<OrdemServico> {
    const row = await this.prisma.ordemServico.update({
      where: { id: os.id },
      data: {
        status: statusOsToPrisma(os.status),
        total: os.total,
        dataConclusao: os.dataConclusao,
        dataEntrega: os.dataEntrega,
      },
    });
    return this.map(row);
  }

  async updateStatus(
    id: string,
    data: UpdateOrdemServicoStatusInput,
  ): Promise<OrdemServicoComClienteVeiculo> {
    const row = await this.prisma.ordemServico.update({
      where: { id },
      data: {
        status: statusOsToPrisma(data.status),
        ...(data.total !== undefined ? { total: data.total } : {}),
        ...(data.dataConclusao !== undefined
          ? { dataConclusao: data.dataConclusao }
          : {}),
        ...(data.dataEntrega !== undefined
          ? { dataEntrega: data.dataEntrega }
          : {}),
      },
      include: clienteVeiculoInclude,
    });
    return this.mapComClienteVeiculo(row);
  }

  async createWithItems(
    input: CreateOrdemServicoInput,
  ): Promise<OrdemServicoComClienteVeiculo> {
    return this.prisma.$transaction(async (tx) => {
      const ordem = await tx.ordemServico.create({
        data: {
          clienteId: input.clienteId,
          veiculoId: input.veiculoId,
          status: statusOsToPrisma(StatusOs.RECEBIDA),
          total: new Prisma.Decimal(input.total),
        },
      });

      if (input.itensServico.length > 0) {
        await tx.itemServicoOs.createMany({
          data: input.itensServico.map((item) => ({
            ordemServicoId: ordem.id,
            servicoCatalogoId: item.servicoCatalogoId,
            quantidade: item.quantidade,
            precoAplicado: new Prisma.Decimal(item.precoAplicado),
          })),
        });
      }

      if (input.itensPeca.length > 0) {
        await tx.itemPecaOs.createMany({
          data: input.itensPeca.map((item) => ({
            ordemServicoId: ordem.id,
            pecaEstoqueId: item.pecaEstoqueId,
            quantidade: item.quantidade,
            precoUnitario: new Prisma.Decimal(item.precoUnitario),
            reservado: false,
            baixado: false,
          })),
        });
      }

      const created = await tx.ordemServico.findUniqueOrThrow({
        where: { id: ordem.id },
        include: clienteVeiculoInclude,
      });
      return this.mapComClienteVeiculo(created);
    });
  }

  async finalizar(id: string): Promise<void> {
    const os = await this.prisma.ordemServico.findUnique({
      where: { id },
      include: { itensPeca: { where: { reservado: true } } },
    });
    if (!os) {
      return;
    }

    const reservadosNaoBaixados = os.itensPeca.filter(
      (item) => item.reservado && !item.baixado,
    );

    await this.prisma.$transaction(async (tx) => {
      if (reservadosNaoBaixados.length > 0) {
        await tx.itemPecaOs.updateMany({
          where: { id: { in: reservadosNaoBaixados.map((i) => i.id) } },
          data: { baixado: true },
        });
      }

      await tx.ordemServico.update({
        where: { id },
        data: {
          status: statusOsToPrisma(StatusOs.FINALIZADA),
          dataConclusao: new Date(),
        },
      });
    });
  }

  async aprovarOrcamentoComReserva(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const pecasReservadas = await reservarPecasNaoReservadasDaOs(
        tx,
        id,
        () => undefined,
      );

      const resultado = await tx.ordemServico.update({
        where: { id },
        data: { status: statusOsToPrisma(StatusOs.EM_EXECUCAO) },
        include: clienteVeiculoInclude,
      });

      return {
        resultado: this.mapComClienteVeiculo(resultado),
        pecasReservadas: pecasReservadas.map((p) => ({
          pecaEstoqueId: p.pecaEstoqueId,
          quantidade: p.quantidade,
        })),
      };
    });
  }

  async rejeitarOrcamento(id: string): Promise<OrdemServicoComClienteVeiculo> {
    const row = await this.prisma.ordemServico.update({
      where: { id },
      data: { status: statusOsToPrisma(StatusOs.REJEITADA) },
      include: clienteVeiculoInclude,
    });
    return this.mapComClienteVeiculo(row);
  }

  async findForGerarOrcamento(id: string) {
    const row = await this.prisma.ordemServico.findUnique({
      where: { id },
      include: {
        ...clienteVeiculoInclude,
        itensServico: { include: { servicoCatalogo: true } },
        itensPeca: { include: { pecaEstoque: true } },
      },
    });
    if (!row) return null;
    return {
      ...this.mapComClienteVeiculo(row),
      itensServico: row.itensServico,
      itensPeca: row.itensPeca,
    };
  }

  async gerarOrcamento(id: string, total: number) {
    const row = await this.prisma.ordemServico.update({
      where: { id },
      data: {
        total: new Prisma.Decimal(total),
        status: statusOsToPrisma(StatusOs.AGUARDANDO_APROVACAO),
      },
      include: {
        ...clienteVeiculoInclude,
        itensServico: { include: { servicoCatalogo: true } },
        itensPeca: { include: { pecaEstoque: true } },
      },
    });
    return {
      ...this.mapComClienteVeiculo(row),
      itensServico: row.itensServico,
      itensPeca: row.itensPeca,
    };
  }
}
