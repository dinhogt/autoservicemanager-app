import { Injectable } from '@nestjs/common';
import { Veiculo as PrismaVeiculo, Prisma } from '@prisma/client';
import { Veiculo } from '../../../../domain/cadastro/entities/veiculo.entity';
import {
  ListarVeiculosFilter,
  VeiculoRepository,
} from '../../../../domain/cadastro/repositories/veiculo.repository';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PrismaVeiculoRepository implements VeiculoRepository {
  constructor(private readonly prisma: PrismaService) {}

  private map(row: PrismaVeiculo): Veiculo {
    return new Veiculo(
      row.id,
      row.clienteId,
      row.placa,
      row.marca,
      row.modelo,
      row.ano,
      row.ativo,
      row.createdAt,
      row.updatedAt,
    );
  }

  private buildWhere(filter?: ListarVeiculosFilter): Prisma.VeiculoWhereInput {
    const where: Prisma.VeiculoWhereInput = {};
    if (!filter?.incluirInativos) where.ativo = true;
    if (filter?.clienteId) where.clienteId = filter.clienteId;
    return where;
  }

  async create(data: {
    clienteId: string;
    placa: string;
    marca?: string | null;
    modelo?: string | null;
    ano?: number | null;
  }): Promise<Veiculo> {
    const row = await this.prisma.veiculo.create({
      data: {
        clienteId: data.clienteId,
        placa: data.placa,
        marca: data.marca ?? null,
        modelo: data.modelo ?? null,
        ano: data.ano ?? null,
      },
    });
    return this.map(row);
  }

  async update(
    id: string,
    data: Partial<{
      marca: string | null;
      modelo: string | null;
      ano: number | null;
      ativo: boolean;
    }>,
  ): Promise<Veiculo> {
    const row = await this.prisma.veiculo.update({
      where: { id },
      data,
    });
    return this.map(row);
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.veiculo.update({
      where: { id },
      data: { ativo: false },
    });
  }

  async findById(id: string): Promise<Veiculo | null> {
    const row = await this.prisma.veiculo.findUnique({ where: { id } });
    return row ? this.map(row) : null;
  }

  async findByPlaca(placaNormalized: string): Promise<Veiculo | null> {
    const row = await this.prisma.veiculo.findUnique({
      where: { placa: placaNormalized },
    });
    return row ? this.map(row) : null;
  }

  async findByClienteId(
    clienteId: string,
    filter?: { incluirInativos?: boolean },
  ): Promise<Veiculo[]> {
    const rows = await this.prisma.veiculo.findMany({
      where: {
        clienteId,
        ...(filter?.incluirInativos ? {} : { ativo: true }),
      },
      orderBy: { placa: 'asc' },
    });
    return rows.map((r) => this.map(r));
  }

  async findAll(
    pagination?: { skip: number; take: number },
    filter?: ListarVeiculosFilter,
  ): Promise<Veiculo[]> {
    const rows = await this.prisma.veiculo.findMany({
      where: this.buildWhere(filter),
      orderBy: { placa: 'asc' },
      ...(pagination && { skip: pagination.skip, take: pagination.take }),
    });
    return rows.map((r) => this.map(r));
  }

  async count(filter?: ListarVeiculosFilter): Promise<number> {
    return this.prisma.veiculo.count({ where: this.buildWhere(filter) });
  }
}
