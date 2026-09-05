import { ConflictException, Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {
  RoleAdmin,
  UsuarioAdmin,
} from '../../../domain/autenticacao/entities/usuario-admin.entity';
import type { UsuarioAdminRepository } from '../../../domain/autenticacao/repositories/usuario-admin.repository';
import { USUARIO_ADMIN_REPOSITORY } from '../../../domain/autenticacao/repositories/usuario-admin.repository';
import { CreateUsuarioDto } from '../dto/create-usuario.dto';

@Injectable()
export class CriarUsuarioUseCase {
  constructor(
    @Inject(USUARIO_ADMIN_REPOSITORY)
    private readonly usuarios: UsuarioAdminRepository,
  ) {}

  async execute(
    dto: CreateUsuarioDto,
  ): Promise<Omit<UsuarioAdmin, 'senhaHash'>> {
    const email = dto.email.toLowerCase().trim();
    const existing = await this.usuarios.findByEmail(email);
    if (existing) {
      throw new ConflictException('Já existe um usuário com este e-mail');
    }

    const senhaHash = await bcrypt.hash(dto.password, 10);
    const user = await this.usuarios.create({
      nome: dto.nome,
      email,
      senhaHash,
      role: dto.role ?? RoleAdmin.ATENDENTE,
    });

    const { senhaHash: _senhaHash, ...result } = user;
    return result;
  }
}
