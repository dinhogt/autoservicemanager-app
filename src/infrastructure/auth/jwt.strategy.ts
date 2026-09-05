import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { UsuarioAdminRepository } from '../../domain/autenticacao/repositories/usuario-admin.repository';
import { USUARIO_ADMIN_REPOSITORY } from '../../domain/autenticacao/repositories/usuario-admin.repository';
import { RoleAdmin } from '../../domain/autenticacao/entities/usuario-admin.entity';

export type JwtPayload = {
  sub: string;
  email: string;
  role: RoleAdmin;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    @Inject(USUARIO_ADMIN_REPOSITORY)
    private readonly usuarios: UsuarioAdminRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(
    payload: JwtPayload,
  ): Promise<{ userId: string; email: string; role: RoleAdmin }> {
    const user = await this.usuarios.findById(payload.sub);
    if (!user || !user.ativo) {
      throw new UnauthorizedException('Usuário não encontrado ou desativado');
    }
    return {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
  }
}
