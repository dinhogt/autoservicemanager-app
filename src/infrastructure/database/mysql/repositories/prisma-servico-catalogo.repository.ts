import { Injectable } from '@nestjs/common';
import { Prisma, ServicoCatalogo as PrismaServico } from '@prisma/client';
import { ServicoCatalogo } from '../../../../domain/catalogo-servicos/entities/servico-catalogo.entity';
import {
  ListarServicosFilter,
  ServicoCatalogoRepository,
} from '../../../../domain/catalogo-servicos/repositories/servico-catalogo.repository';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PrismaServicoCatalogoRepository implements ServicoCatalogoRepository {
  constructor(private readonly prisma: PrismaService) {}

  private map(row: PrismaServico): ServicoCatalogo {
    return new ServicoCatalogo(
      row.id,
      row.descricao,
      Number(row.precoBase),
      row.tempoMedioExecucao,
      row.ativo,
      row.createdAt,
      row.updatedAt,
    );
  }

  private buildWhere(
    filter?: ListarServicosFilter,
  ): Prisma.ServicoCatalogoWhereInput {
    if (filter?.incluirInativos) return {};
    return { ativo: true };
  }

  async create(data: {
    descricao: string;
    precoBase: number;
    tempoMedioExecucao: number;
  }): Promise<ServicoCatalogo> {
    const row = await this.prisma.servicoCatalogo.create({
      data: {
        descricao: data.descricao,
        precoBase: data.precoBase,
        tempoMedioExecucao: data.tempoMedioExecucao,
      },
    });
    return this.map(row);
  }

  async update(
    id: string,
    data: Partial<{
      descricao: string;
      precoBase: number;
      tempoMedioExecucao: number;
      ativo: boolean;
    }>,
  ): Promise<ServicoCatalogo> {
    const row = await this.prisma.servicoCatalogo.update({
      where: { id },
      data,
    });
    return this.map(row);
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.servicoCatalogo.update({
      where: { id },
      data: { ativo: false },
    });
  }

  async findById(id: string): Promise<ServicoCatalogo | null> {
    const row = await this.prisma.servicoCatalogo.findUnique({
      where: { id },
    });
    return row ? this.map(row) : null;
  }

  async findActiveByIds(ids: string[]): Promise<ServicoCatalogo[]> {
    if (ids.length === 0) return [];
    const rows = await this.prisma.servicoCatalogo.findMany({
      where: { id: { in: ids }, ativo: true },
    });
    return rows.map((r) => this.map(r));
  }

  async findAll(
    pagination?: { skip: number; take: number },
    filter?: ListarServicosFilter,
  ): Promise<ServicoCatalogo[]> {
    const rows = await this.prisma.servicoCatalogo.findMany({
      where: this.buildWhere(filter),
      orderBy: { descricao: 'asc' },
      ...(pagination && { skip: pagination.skip, take: pagination.take }),
    });
    return rows.map((r) => this.map(r));
  }

  async count(filter?: ListarServicosFilter): Promise<number> {
    return this.prisma.servicoCatalogo.count({
      where: this.buildWhere(filter),
    });
  }
}
