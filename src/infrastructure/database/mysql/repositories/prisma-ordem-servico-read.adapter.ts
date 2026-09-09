import { Injectable } from '@nestjs/common';
import {
  OrdemServicoReadPort,
  TempoMedioExecucaoAggregate,
} from '../../../../domain/atendimento/ports/ordem-servico-read.port';
import {
  STATUS_OS_NAO_TERMINAIS,
  STATUS_OS_TERMINAIS_PARA_METRICAS,
} from '../../../../domain/atendimento/value-objects/status-os.enum';
import { statusOsToPrisma } from '../mappers/status-os.mapper';
import { PrismaService } from '../prisma.service';

const MS_PER_MIN = 60_000;

@Injectable()
export class PrismaOrdemServicoReadAdapter implements OrdemServicoReadPort {
  constructor(private readonly prisma: PrismaService) {}

  async existsById(id: string): Promise<boolean> {
    const row = await this.prisma.ordemServico.findUnique({
      where: { id },
      select: { id: true },
    });
    return row != null;
  }

  async countAtivasByClienteId(clienteId: string): Promise<number> {
    return this.prisma.ordemServico.count({
      where: {
        clienteId,
        status: { in: STATUS_OS_NAO_TERMINAIS.map(statusOsToPrisma) },
      },
    });
  }

  async countAtivasByVeiculoId(veiculoId: string): Promise<number> {
    return this.prisma.ordemServico.count({
      where: {
        veiculoId,
        status: { in: STATUS_OS_NAO_TERMINAIS.map(statusOsToPrisma) },
      },
    });
  }

  async countAtivasUsandoServico(servicoCatalogoId: string): Promise<number> {
    return this.prisma.itemServicoOs.count({
      where: {
        servicoCatalogoId,
        ordemServico: {
          status: { in: STATUS_OS_NAO_TERMINAIS.map(statusOsToPrisma) },
        },
      },
    });
  }

  async countReservasAtivasPeca(pecaEstoqueId: string): Promise<number> {
    return this.prisma.itemPecaOs.count({
      where: {
        pecaEstoqueId,
        reservado: true,
        baixado: false,
      },
    });
  }

  async obterTempoMedioExecucao(): Promise<TempoMedioExecucaoAggregate> {
    const [ordens, porFase] = await Promise.all([
      this.prisma.ordemServico.findMany({
        where: {
          status: {
            in: STATUS_OS_TERMINAIS_PARA_METRICAS.map(statusOsToPrisma),
          },
          dataConclusao: { not: null },
        },
        select: {
          id: true,
          dataCriacao: true,
          dataConclusao: true,
          itensServico: {
            select: {
              servicoCatalogoId: true,
              servicoCatalogo: { select: { descricao: true } },
            },
          },
        },
      }),
      this.obterTempoMedioPorFase(),
    ]);

    if (ordens.length === 0) {
      return { totalOs: 0, globalMinutos: null, porServico: [], porFase };
    }

    let somaGlobal = 0;
    const porServicoMap = new Map<
      string,
      { descricao: string; somaMin: number; total: number }
    >();

    for (const os of ordens) {
      if (!os.dataConclusao) continue;
      const minutos =
        (os.dataConclusao.getTime() - os.dataCriacao.getTime()) / MS_PER_MIN;
      somaGlobal += minutos;

      for (const item of os.itensServico) {
        const key = item.servicoCatalogoId;
        const acc = porServicoMap.get(key) ?? {
          descricao: item.servicoCatalogo.descricao,
          somaMin: 0,
          total: 0,
        };
        acc.somaMin += minutos;
        acc.total += 1;
        porServicoMap.set(key, acc);
      }
    }

    const porServico = [...porServicoMap.entries()].map(([servicoId, agg]) => ({
      servicoId,
      descricao: agg.descricao,
      totalOs: agg.total,
      mediaMinutos: round1(agg.somaMin / agg.total),
    }));
    porServico.sort((a, b) => a.descricao.localeCompare(b.descricao));

    return {
      totalOs: ordens.length,
      globalMinutos: round1(somaGlobal / ordens.length),
      porServico,
      porFase,
    };
  }

  /**
   * Permanência média em Diagnóstico / Execução / Finalização:
   * diff enteredAt(toStatus=fase) → enteredAt(próxima linha com fromStatus=fase).
   */
  private async obterTempoMedioPorFase(): Promise<
    TempoMedioExecucaoAggregate['porFase']
  > {
    const fases: Array<{
      fase: 'Diagnostico' | 'Execucao' | 'Finalizacao';
      status: 'EM_DIAGNOSTICO' | 'EM_EXECUCAO' | 'FINALIZADA';
    }> = [
      { fase: 'Diagnostico', status: 'EM_DIAGNOSTICO' },
      { fase: 'Execucao', status: 'EM_EXECUCAO' },
      { fase: 'Finalizacao', status: 'FINALIZADA' },
    ];

    const result: TempoMedioExecucaoAggregate['porFase'] = [];

    for (const { fase, status } of fases) {
      const entradas = await this.prisma.ordemServicoStatusHistorico.findMany({
        where: { toStatus: status },
        select: { id: true, ordemServicoId: true, enteredAt: true },
        orderBy: { enteredAt: 'asc' },
      });

      let soma = 0;
      let total = 0;
      for (const entrada of entradas) {
        const saida = await this.prisma.ordemServicoStatusHistorico.findFirst({
          where: {
            ordemServicoId: entrada.ordemServicoId,
            fromStatus: status,
            enteredAt: { gt: entrada.enteredAt },
          },
          orderBy: { enteredAt: 'asc' },
          select: { enteredAt: true },
        });
        if (!saida) continue;
        soma +=
          (saida.enteredAt.getTime() - entrada.enteredAt.getTime()) / MS_PER_MIN;
        total += 1;
      }

      result.push({
        fase,
        status,
        totalTransicoes: total,
        mediaMinutos: total > 0 ? round1(soma / total) : null,
      });
    }

    return result;
  }
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
