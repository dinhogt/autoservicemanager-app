import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UsuarioAdmin } from '../../../domain/autenticacao/entities/usuario-admin.entity';
import type { UsuarioAdminRepository } from '../../../domain/autenticacao/repositories/usuario-admin.repository';
import { USUARIO_ADMIN_REPOSITORY } from '../../../domain/autenticacao/repositories/usuario-admin.repository';
import { UpdateUsuarioDto } from '../dto/update-usuario.dto';

@Injectable()
export class AtualizarUsuarioUseCase {
  constructor(
    @Inject(USUARIO_ADMIN_REPOSITORY)
    private readonly usuarios: UsuarioAdminRepository,
  ) {}

  async execute(
    id: string,
    dto: UpdateUsuarioDto,
  ): Promise<Omit<UsuarioAdmin, 'senhaHash'>> {
    const existing = await this.usuarios.findById(id);
    if (!existing) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (dto.email) {
      const email = dto.email.toLowerCase().trim();
      const duplicate = await this.usuarios.findByEmail(email);
      if (duplicate && duplicate.id !== id) {
        throw new ConflictException('Já existe um usuário com este e-mail');
      }
      dto.email = email;
    }

    const updated = await this.usuarios.update(id, dto);
    const { senhaHash: _senhaHash, ...result } = updated;
    return result;
  }
}
