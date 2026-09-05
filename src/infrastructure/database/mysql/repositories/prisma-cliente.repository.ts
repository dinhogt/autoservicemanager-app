import { Injectable } from '@nestjs/common';
import { Cliente as PrismaCliente, Prisma } from '@prisma/client';
import { Cliente } from '../../../../domain/cadastro/entities/cliente.entity';
import {
  ClienteRepository,
  ListarClientesFilter,
} from '../../../../domain/cadastro/repositories/cliente.repository';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PrismaClienteRepository implements ClienteRepository {
  constructor(private readonly prisma: PrismaService) {}

  private map(row: PrismaCliente): Cliente {
    return new Cliente(
      row.id,
      row.nome,
      row.cpfCnpj,
      row.contato,
      row.enderecos,
      row.ativo,
      row.createdAt,
      row.updatedAt,
    );
  }

  private buildWhere(filter?: ListarClientesFilter): Prisma.ClienteWhereInput {
    if (filter?.incluirInativos) return {};
    return { ativo: true };
  }

  async create(data: {
    nome: string;
    cpfCnpj: string;
    contato?: string | null;
    enderecos?: string | null;
  }): Promise<Cliente> {
    const row = await this.prisma.cliente.create({
      data: {
        nome: data.nome,
        cpfCnpj: data.cpfCnpj,
        contato: data.contato ?? null,
        enderecos: data.enderecos ?? null,
      },
    });
    return this.map(row);
  }

  async update(
    id: string,
    data: Partial<{
      nome: string;
      contato: string | null;
      enderecos: string | null;
      ativo: boolean;
    }>,
  ): Promise<Cliente> {
    const row = await this.prisma.cliente.update({
      where: { id },
      data,
    });
    return this.map(row);
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.cliente.update({
      where: { id },
      data: { ativo: false },
    });
  }

  async findById(id: string): Promise<Cliente | null> {
    const row = await this.prisma.cliente.findUnique({ where: { id } });
    return row ? this.map(row) : null;
  }

  async findByCpfCnpj(cpfCnpjDigits: string): Promise<Cliente | null> {
    const row = await this.prisma.cliente.findUnique({
      where: { cpfCnpj: cpfCnpjDigits },
    });
    return row ? this.map(row) : null;
  }

  async findAll(
    pagination?: { skip: number; take: number },
    filter?: ListarClientesFilter,
  ): Promise<Cliente[]> {
    const rows = await this.prisma.cliente.findMany({
      where: this.buildWhere(filter),
      orderBy: { nome: 'asc' },
      ...(pagination && { skip: pagination.skip, take: pagination.take }),
    });
    return rows.map((r) => this.map(r));
  }

  async count(filter?: ListarClientesFilter): Promise<number> {
    return this.prisma.cliente.count({ where: this.buildWhere(filter) });
  }
}
