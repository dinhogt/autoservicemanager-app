import { Injectable, Inject } from '@nestjs/common';
import { Cliente } from '../../../domain/cadastro/entities/cliente.entity';
import type { ClienteRepository } from '../../../domain/cadastro/repositories/cliente.repository';
import { CLIENTE_REPOSITORY } from '../../../domain/cadastro/repositories/cliente.repository';
import {
  PaginatedResult,
  PaginationDto,
} from '../../../shared/dto/pagination.dto';

@Injectable()
export class ListarClientesUseCase {
  constructor(
    @Inject(CLIENTE_REPOSITORY)
    private readonly clientes: ClienteRepository,
  ) {}

  async execute(
    pagination: PaginationDto,
    options?: { incluirInativos?: boolean },
  ): Promise<PaginatedResult<Cliente>> {
    const filter = { incluirInativos: options?.incluirInativos ?? false };
    const [data, total] = await Promise.all([
      this.clientes.findAll(
        { skip: pagination.skip, take: pagination.limit },
        filter,
      ),
      this.clientes.count(filter),
    ]);

    return {
      data,
      meta: {
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  }
}
