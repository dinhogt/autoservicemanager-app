import { Inject, Injectable } from '@nestjs/common';
import { ORDEM_SERVICO_REPOSITORY } from '../../../domain/atendimento/repositories/ordem-servico.repository';
import type { OrdemServicoRepository } from '../../../domain/atendimento/repositories/ordem-servico.repository';
import {
  PaginatedResult,
  PaginationDto,
} from '../../../shared/dto/pagination.dto';

@Injectable()
export class ListarOrdensServicoUseCase {
  constructor(
    @Inject(ORDEM_SERVICO_REPOSITORY)
    private readonly ordens: OrdemServicoRepository,
  ) {}

  async execute(pagination: PaginationDto): Promise<PaginatedResult<unknown>> {
    const [data, total] = await Promise.all([
      this.ordens.listarAtivasParaPainel({
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.ordens.countAtivasParaPainel(),
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
