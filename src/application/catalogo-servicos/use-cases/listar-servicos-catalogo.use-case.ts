import { Injectable, Inject } from '@nestjs/common';
import { ServicoCatalogo } from '../../../domain/catalogo-servicos/entities/servico-catalogo.entity';
import type { ServicoCatalogoRepository } from '../../../domain/catalogo-servicos/repositories/servico-catalogo.repository';
import { SERVICO_CATALOGO_REPOSITORY } from '../../../domain/catalogo-servicos/repositories/servico-catalogo.repository';
import {
  PaginatedResult,
  PaginationDto,
} from '../../../shared/dto/pagination.dto';

@Injectable()
export class ListarServicosCatalogoUseCase {
  constructor(
    @Inject(SERVICO_CATALOGO_REPOSITORY)
    private readonly servicos: ServicoCatalogoRepository,
  ) {}

  async execute(
    pagination: PaginationDto,
    options?: { incluirInativos?: boolean },
  ): Promise<PaginatedResult<ServicoCatalogo>> {
    const filter = { incluirInativos: options?.incluirInativos ?? false };
    const [data, total] = await Promise.all([
      this.servicos.findAll(
        { skip: pagination.skip, take: pagination.limit },
        filter,
      ),
      this.servicos.count(filter),
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
