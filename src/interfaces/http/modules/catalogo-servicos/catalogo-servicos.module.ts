import { Module } from '@nestjs/common';
import { PrismaServicoCatalogoRepository } from '../../../../infrastructure/database/mysql/repositories/prisma-servico-catalogo.repository';
import { SERVICO_CATALOGO_REPOSITORY } from '../../../../domain/catalogo-servicos/repositories/servico-catalogo.repository';
import {
  AtualizarServicoCatalogoUseCase,
  CadastrarServicoCatalogoUseCase,
  InativarServicoCatalogoUseCase,
  ListarServicosCatalogoUseCase,
  ObterServicoCatalogoUseCase,
} from '../../../../application/catalogo-servicos/use-cases';
import { ServicoCatalogoController } from './servico-catalogo.controller';
import { ORDEM_SERVICO_READ_PORT } from '../../../../domain/atendimento/ports/ordem-servico-read.port';
import { PrismaOrdemServicoReadAdapter } from '../../../../infrastructure/database/mysql/repositories/prisma-ordem-servico-read.adapter';

@Module({
  controllers: [ServicoCatalogoController],
  providers: [
    {
      provide: SERVICO_CATALOGO_REPOSITORY,
      useClass: PrismaServicoCatalogoRepository,
    },
    CadastrarServicoCatalogoUseCase,
    ListarServicosCatalogoUseCase,
    ObterServicoCatalogoUseCase,
    AtualizarServicoCatalogoUseCase,
    InativarServicoCatalogoUseCase,
    {
      provide: ORDEM_SERVICO_READ_PORT,
      useClass: PrismaOrdemServicoReadAdapter,
    },
  ],
})
export class CatalogoServicosModule {}
