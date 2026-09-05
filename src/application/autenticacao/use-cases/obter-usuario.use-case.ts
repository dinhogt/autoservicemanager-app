import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { UsuarioAdmin } from '../../../domain/autenticacao/entities/usuario-admin.entity';
import type { UsuarioAdminRepository } from '../../../domain/autenticacao/repositories/usuario-admin.repository';
import { USUARIO_ADMIN_REPOSITORY } from '../../../domain/autenticacao/repositories/usuario-admin.repository';

@Injectable()
export class ObterUsuarioUseCase {
  constructor(
    @Inject(USUARIO_ADMIN_REPOSITORY)
    private readonly usuarios: UsuarioAdminRepository,
  ) {}

  async execute(id: string): Promise<Omit<UsuarioAdmin, 'senhaHash'>> {
    const user = await this.usuarios.findById(id);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    const { senhaHash: _senhaHash, ...result } = user;
    return result;
  }
}
