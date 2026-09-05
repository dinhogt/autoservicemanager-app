import {
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PecaEstoque } from '../../../domain/estoque/entities/peca-estoque.entity';
import type { PecaEstoqueRepository } from '../../../domain/estoque/repositories/peca-estoque.repository';
import { PECA_ESTOQUE_REPOSITORY } from '../../../domain/estoque/repositories/peca-estoque.repository';
import { DomainException } from '../../../shared/errors/domain.exception';
import {
  MovimentarEstoqueDto,
  TipoMovimentacaoEstoque,
} from '../dto/movimentar-estoque.dto';

@Injectable()
export class MovimentarEstoquePecaUseCase {
  constructor(
    @Inject(PECA_ESTOQUE_REPOSITORY)
    private readonly pecas: PecaEstoqueRepository,
  ) {}

  async execute(id: string, dto: MovimentarEstoqueDto): Promise<PecaEstoque> {
    const delta =
      dto.tipo === TipoMovimentacaoEstoque.ENTRADA
        ? dto.quantidade
        : -dto.quantidade;
    try {
      return await this.pecas.aplicarMovimentacao(id, delta);
    } catch (e) {
      if (e instanceof DomainException) {
        if (e.code === 'PECA_NOT_FOUND') {
          throw new NotFoundException(e.message);
        }
        if (e.code === 'ESTOQUE_INSUFICIENTE') {
          throw new UnprocessableEntityException(e.message);
        }
      }
      throw e;
    }
  }
}
