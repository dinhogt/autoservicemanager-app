import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import {
  LoginAdminUseCase,
  CriarUsuarioUseCase,
  ListarUsuariosUseCase,
  ObterUsuarioUseCase,
  AtualizarUsuarioUseCase,
  AlterarSenhaUseCase,
} from '../../application/autenticacao/use-cases';
import { USUARIO_ADMIN_REPOSITORY } from '../../domain/autenticacao/repositories/usuario-admin.repository';
import { PrismaUsuarioAdminRepository } from '../database/mysql/repositories/prisma-usuario-admin.repository';
import { AuthController } from '../../interfaces/http/modules/auth/auth.controller';
import { UsuarioController } from '../../interfaces/http/modules/auth/usuario.controller';
import { PrismaModule } from '../database/mysql/prisma.module';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ClienteAuthGuard } from './cliente-auth.guard';
import { RolesGuard } from './roles.guard';
import { JWT_EXPIRES_IN } from './jwt.constants';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: JWT_EXPIRES_IN },
      }),
    }),
  ],
  controllers: [AuthController, UsuarioController],
  providers: [
    {
      provide: USUARIO_ADMIN_REPOSITORY,
      useClass: PrismaUsuarioAdminRepository,
    },
    JwtStrategy,
    JwtAuthGuard,
    ClienteAuthGuard,
    RolesGuard,
    LoginAdminUseCase,
    CriarUsuarioUseCase,
    ListarUsuariosUseCase,
    ObterUsuarioUseCase,
    AtualizarUsuarioUseCase,
    AlterarSenhaUseCase,
  ],
  exports: [
    JwtModule,
    PassportModule,
    JwtAuthGuard,
    ClienteAuthGuard,
    USUARIO_ADMIN_REPOSITORY,
  ],
})
export class AuthModule {}
