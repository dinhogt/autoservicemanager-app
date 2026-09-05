import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { PecaEstoque } from '../../../domain/estoque/entities/peca-estoque.entity';
import type { PecaEstoqueRepository } from '../../../domain/estoque/repositories/peca-estoque.repository';
import { PECA_ESTOQUE_REPOSITORY } from '../../../domain/estoque/repositories/peca-estoque.repository';
import { normalizeCodigoInterno } from '../../../shared/utils/codigo-interno.util';
import { CreatePecaDto } from '../dto/create-peca.dto';

@Injectable()
export class CadastrarPecaUseCase {
  constructor(
    @Inject(PECA_ESTOQUE_REPOSITORY)
    private readonly pecas: PecaEstoqueRepository,
  ) {}

  async execute(dto: CreatePecaDto): Promise<PecaEstoque> {
    const codigo = normalizeCodigoInterno(dto.codigoInterno);
    const dup = await this.pecas.findByCodigoInterno(codigo);
    if (dup) {
      throw new ConflictException('Já existe peça com este código interno');
    }
    return this.pecas.create({
      descricao: dto.descricao,
      precoUnitario: dto.precoUnitario,
      quantidadeEmEstoque: dto.quantidadeEmEstoque ?? 0,
      codigoInterno: codigo,
    });
  }
}
