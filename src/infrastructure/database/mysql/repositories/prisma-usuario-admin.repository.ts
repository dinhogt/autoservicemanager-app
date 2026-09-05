import { Injectable } from '@nestjs/common';
import { UsuarioAdmin as PrismaUsuarioAdmin } from '@prisma/client';
import {
  RoleAdmin,
  UsuarioAdmin,
} from '../../../../domain/autenticacao/entities/usuario-admin.entity';
import { UsuarioAdminRepository } from '../../../../domain/autenticacao/repositories/usuario-admin.repository';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PrismaUsuarioAdminRepository implements UsuarioAdminRepository {
  constructor(private readonly prisma: PrismaService) {}

  private map(row: PrismaUsuarioAdmin): UsuarioAdmin {
    return new UsuarioAdmin(
      row.id,
      row.nome,
      row.email,
      row.senhaHash,
      row.role as RoleAdmin,
      row.ativo,
      row.createdAt,
      row.updatedAt,
    );
  }

  async create(data: {
    nome: string;
    email: string;
    senhaHash: string;
    role: RoleAdmin;
  }): Promise<UsuarioAdmin> {
    const row = await this.prisma.usuarioAdmin.create({ data });
    return this.map(row);
  }

  async update(
    id: string,
    data: Partial<{
      nome: string;
      email: string;
      senhaHash: string;
      role: RoleAdmin;
      ativo: boolean;
    }>,
  ): Promise<UsuarioAdmin> {
    const row = await this.prisma.usuarioAdmin.update({
      where: { id },
      data,
    });
    return this.map(row);
  }

  async findById(id: string): Promise<UsuarioAdmin | null> {
    const row = await this.prisma.usuarioAdmin.findUnique({ where: { id } });
    return row ? this.map(row) : null;
  }

  async findByEmail(email: string): Promise<UsuarioAdmin | null> {
    const row = await this.prisma.usuarioAdmin.findUnique({
      where: { email },
    });
    return row ? this.map(row) : null;
  }

  async findAll(pagination?: {
    skip: number;
    take: number;
  }): Promise<UsuarioAdmin[]> {
    const rows = await this.prisma.usuarioAdmin.findMany({
      orderBy: { nome: 'asc' },
      ...(pagination && { skip: pagination.skip, take: pagination.take }),
    });
    return rows.map((r) => this.map(r));
  }

  async count(): Promise<number> {
    return this.prisma.usuarioAdmin.count();
  }
}
