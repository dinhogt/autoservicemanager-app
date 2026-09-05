import { Inject, Injectable } from '@nestjs/common';
import { PecaEstoque } from '../../../domain/estoque/entities/peca-estoque.entity';
import type { PecaEstoqueRepository } from '../../../domain/estoque/repositories/peca-estoque.repository';
import { PECA_ESTOQUE_REPOSITORY } from '../../../domain/estoque/repositories/peca-estoque.repository';
import {
  PaginatedResult,
  PaginationDto,
} from '../../../shared/dto/pagination.dto';

@Injectable()
export class ListarPecasUseCase {
  constructor(
    @Inject(PECA_ESTOQUE_REPOSITORY)
    private readonly pecas: PecaEstoqueRepository,
  ) {}

  async execute(
    pagination: PaginationDto,
    options?: { incluirInativos?: boolean },
  ): Promise<PaginatedResult<PecaEstoque>> {
    const filter = { incluirInativos: options?.incluirInativos ?? false };
    const [data, total] = await Promise.all([
      this.pecas.findAll(
        { skip: pagination.skip, take: pagination.limit },
        filter,
      ),
      this.pecas.count(filter),
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
