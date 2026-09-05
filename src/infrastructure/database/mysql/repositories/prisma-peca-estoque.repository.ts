import { Injectable } from '@nestjs/common';
import { PecaEstoque as PrismaPeca, Prisma } from '@prisma/client';
import { PecaEstoque } from '../../../../domain/estoque/entities/peca-estoque.entity';
import {
  ListarPecasFilter,
  PecaEstoqueRepository,
} from '../../../../domain/estoque/repositories/peca-estoque.repository';
import { DomainException } from '../../../../shared/errors/domain.exception';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PrismaPecaEstoqueRepository implements PecaEstoqueRepository {
  constructor(private readonly prisma: PrismaService) {}

  private map(row: PrismaPeca): PecaEstoque {
    return new PecaEstoque(
      row.id,
      row.descricao,
      Number(row.precoUnitario),
      row.quantidadeEmEstoque,
      row.codigoInterno,
      row.ativo,
      row.createdAt,
      row.updatedAt,
    );
  }

  private buildWhere(filter?: ListarPecasFilter): Prisma.PecaEstoqueWhereInput {
    if (filter?.incluirInativos) return {};
    return { ativo: true };
  }

  async create(data: {
    descricao: string;
    precoUnitario: number;
    quantidadeEmEstoque: number;
    codigoInterno: string;
  }): Promise<PecaEstoque> {
    const row = await this.prisma.pecaEstoque.create({
      data: {
        descricao: data.descricao,
        precoUnitario: data.precoUnitario,
        quantidadeEmEstoque: data.quantidadeEmEstoque,
        codigoInterno: data.codigoInterno,
      },
    });
    return this.map(row);
  }

  async update(
    id: string,
    data: Partial<{
      descricao: string;
      precoUnitario: number;
      ativo: boolean;
    }>,
  ): Promise<PecaEstoque> {
    const row = await this.prisma.pecaEstoque.update({
      where: { id },
      data,
    });
    return this.map(row);
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.pecaEstoque.update({
      where: { id },
      data: { ativo: false },
    });
  }

  async findById(id: string): Promise<PecaEstoque | null> {
    const row = await this.prisma.pecaEstoque.findUnique({ where: { id } });
    return row ? this.map(row) : null;
  }

  async findActiveByIds(ids: string[]): Promise<PecaEstoque[]> {
    if (ids.length === 0) return [];
    const rows = await this.prisma.pecaEstoque.findMany({
      where: { id: { in: ids }, ativo: true },
    });
    return rows.map((r) => this.map(r));
  }

  async findByCodigoInterno(codigo: string): Promise<PecaEstoque | null> {
    const row = await this.prisma.pecaEstoque.findUnique({
      where: { codigoInterno: codigo },
    });
    return row ? this.map(row) : null;
  }

  async findAll(
    pagination?: { skip: number; take: number },
    filter?: ListarPecasFilter,
  ): Promise<PecaEstoque[]> {
    const rows = await this.prisma.pecaEstoque.findMany({
      where: this.buildWhere(filter),
      orderBy: { codigoInterno: 'asc' },
      ...(pagination && { skip: pagination.skip, take: pagination.take }),
    });
    return rows.map((r) => this.map(r));
  }

  async count(filter?: ListarPecasFilter): Promise<number> {
    return this.prisma.pecaEstoque.count({ where: this.buildWhere(filter) });
  }

  async aplicarMovimentacao(id: string, delta: number): Promise<PecaEstoque> {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.pecaEstoque.findUnique({ where: { id } });
      if (!current) {
        throw new DomainException('Peça não encontrada', 'PECA_NOT_FOUND');
      }
      const next = current.quantidadeEmEstoque + delta;
      if (next < 0) {
        throw new DomainException(
          'Estoque insuficiente para a quantidade solicitada',
          'ESTOQUE_INSUFICIENTE',
        );
      }
      const row = await tx.pecaEstoque.update({
        where: { id },
        data: { quantidadeEmEstoque: next },
      });
      return this.map(row);
    });
  }
}
