import {
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type { UsuarioAdminRepository } from '../../../domain/autenticacao/repositories/usuario-admin.repository';
import { USUARIO_ADMIN_REPOSITORY } from '../../../domain/autenticacao/repositories/usuario-admin.repository';
import { ChangePasswordDto } from '../dto/change-password.dto';

@Injectable()
export class AlterarSenhaUseCase {
  constructor(
    @Inject(USUARIO_ADMIN_REPOSITORY)
    private readonly usuarios: UsuarioAdminRepository,
  ) {}

  async execute(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.usuarios.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const senhaValida = await bcrypt.compare(
      dto.currentPassword,
      user.senhaHash,
    );
    if (!senhaValida) {
      throw new UnauthorizedException('Senha atual incorreta');
    }

    const novaSenhaHash = await bcrypt.hash(dto.newPassword, 10);
    await this.usuarios.update(userId, { senhaHash: novaSenhaHash });
  }
}
