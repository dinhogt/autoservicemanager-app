import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { JWT_EXPIRES_IN_SECONDS } from '../../../domain/autenticacao/constants/jwt-expiration.constants';
import type { UsuarioAdminRepository } from '../../../domain/autenticacao/repositories/usuario-admin.repository';
import { USUARIO_ADMIN_REPOSITORY } from '../../../domain/autenticacao/repositories/usuario-admin.repository';
import { LoginDto } from '../dto/login.dto';

export type LoginAdminResult = {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  user: {
    id: string;
    nome: string;
    email: string;
    role: string;
  };
};

@Injectable()
export class LoginAdminUseCase {
  constructor(
    @Inject(USUARIO_ADMIN_REPOSITORY)
    private readonly usuarios: UsuarioAdminRepository,
    private readonly jwtService: JwtService,
  ) {}

  async execute(dto: LoginDto): Promise<LoginAdminResult> {
    const user = await this.usuarios.findByEmail(
      dto.email.toLowerCase().trim(),
    );
    if (!user || !user.ativo) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    const ok = await bcrypt.compare(dto.password, user.senhaHash);
    if (!ok) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    const access_token = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    return {
      access_token,
      token_type: 'Bearer',
      expires_in: JWT_EXPIRES_IN_SECONDS,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
      },
    };
  }
}
