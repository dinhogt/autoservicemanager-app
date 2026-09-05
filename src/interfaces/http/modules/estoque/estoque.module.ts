import { Module } from '@nestjs/common';
import { PrismaPecaEstoqueRepository } from '../../../../infrastructure/database/mysql/repositories/prisma-peca-estoque.repository';
import { PECA_ESTOQUE_REPOSITORY } from '../../../../domain/estoque/repositories/peca-estoque.repository';
import {
  AtualizarPecaUseCase,
  CadastrarPecaUseCase,
  InativarPecaUseCase,
  ListarPecasUseCase,
  MovimentarEstoquePecaUseCase,
  ObterPecaUseCase,
} from '../../../../application/estoque/use-cases';
import { PecaController } from './peca.controller';
import { ORDEM_SERVICO_READ_PORT } from '../../../../domain/atendimento/ports/ordem-servico-read.port';
import { PrismaOrdemServicoReadAdapter } from '../../../../infrastructure/database/mysql/repositories/prisma-ordem-servico-read.adapter';

@Module({
  controllers: [PecaController],
  providers: [
    { provide: PECA_ESTOQUE_REPOSITORY, useClass: PrismaPecaEstoqueRepository },
    CadastrarPecaUseCase,
    ListarPecasUseCase,
    ObterPecaUseCase,
    AtualizarPecaUseCase,
    MovimentarEstoquePecaUseCase,
    InativarPecaUseCase,
    {
      provide: ORDEM_SERVICO_READ_PORT,
      useClass: PrismaOrdemServicoReadAdapter,
    },
  ],
})
export class EstoqueModule {}
