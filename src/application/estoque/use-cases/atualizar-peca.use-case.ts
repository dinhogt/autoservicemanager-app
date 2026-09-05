import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PecaEstoque } from '../../../domain/estoque/entities/peca-estoque.entity';
import type { PecaEstoqueRepository } from '../../../domain/estoque/repositories/peca-estoque.repository';
import { PECA_ESTOQUE_REPOSITORY } from '../../../domain/estoque/repositories/peca-estoque.repository';
import { UpdatePecaDto } from '../dto/update-peca.dto';

@Injectable()
export class AtualizarPecaUseCase {
  constructor(
    @Inject(PECA_ESTOQUE_REPOSITORY)
    private readonly pecas: PecaEstoqueRepository,
  ) {}

  async execute(id: string, dto: UpdatePecaDto): Promise<PecaEstoque> {
    const existing = await this.pecas.findById(id);
    if (!existing) {
      throw new NotFoundException('Peça não encontrada');
    }
    const patch: Partial<{
      descricao: string;
      precoUnitario: number;
    }> = {};
    if (dto.descricao !== undefined) patch.descricao = dto.descricao;
    if (dto.precoUnitario !== undefined)
      patch.precoUnitario = dto.precoUnitario;
    if (Object.keys(patch).length === 0) {
      return existing;
    }
    return this.pecas.update(id, patch);
  }
}
