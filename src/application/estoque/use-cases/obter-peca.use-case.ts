import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PecaEstoque } from '../../../domain/estoque/entities/peca-estoque.entity';
import type { PecaEstoqueRepository } from '../../../domain/estoque/repositories/peca-estoque.repository';
import { PECA_ESTOQUE_REPOSITORY } from '../../../domain/estoque/repositories/peca-estoque.repository';

@Injectable()
export class ObterPecaUseCase {
  constructor(
    @Inject(PECA_ESTOQUE_REPOSITORY)
    private readonly pecas: PecaEstoqueRepository,
  ) {}

  async execute(id: string): Promise<PecaEstoque> {
    const p = await this.pecas.findById(id);
    if (!p) {
      throw new NotFoundException('Peça não encontrada');
    }
    return p;
  }
}
