import { Inject, Injectable } from '@nestjs/common';
import { UsuarioAdmin } from '../../../domain/autenticacao/entities/usuario-admin.entity';
import type { UsuarioAdminRepository } from '../../../domain/autenticacao/repositories/usuario-admin.repository';
import { USUARIO_ADMIN_REPOSITORY } from '../../../domain/autenticacao/repositories/usuario-admin.repository';
import {
  PaginatedResult,
  PaginationDto,
} from '../../../shared/dto/pagination.dto';

type UsuarioSemSenha = Omit<UsuarioAdmin, 'senhaHash'>;

@Injectable()
export class ListarUsuariosUseCase {
  constructor(
    @Inject(USUARIO_ADMIN_REPOSITORY)
    private readonly usuarios: UsuarioAdminRepository,
  ) {}

  async execute(
    pagination: PaginationDto,
  ): Promise<PaginatedResult<UsuarioSemSenha>> {
    const [data, total] = await Promise.all([
      this.usuarios.findAll({
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.usuarios.count(),
    ]);

    return {
      data: data.map(({ senhaHash: _senhaHash, ...u }) => u),
      meta: {
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  }
}
