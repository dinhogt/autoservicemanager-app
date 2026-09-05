import { Module } from '@nestjs/common';
import { PrismaClienteRepository } from '../../../../infrastructure/database/mysql/repositories/prisma-cliente.repository';
import { PrismaVeiculoRepository } from '../../../../infrastructure/database/mysql/repositories/prisma-veiculo.repository';
import { CLIENTE_REPOSITORY } from '../../../../domain/cadastro/repositories/cliente.repository';
import { VEICULO_REPOSITORY } from '../../../../domain/cadastro/repositories/veiculo.repository';
import {
  AtualizarClienteUseCase,
  AtualizarVeiculoUseCase,
  CadastrarClienteUseCase,
  CadastrarVeiculoUseCase,
  InativarClienteUseCase,
  InativarVeiculoUseCase,
  ListarClientesUseCase,
  ListarVeiculosUseCase,
  ObterClienteUseCase,
  ObterVeiculoUseCase,
} from '../../../../application/cadastro/use-cases';
import { ClienteController } from './cliente.controller';
import { VeiculoController } from './veiculo.controller';
import { ORDEM_SERVICO_READ_PORT } from '../../../../domain/atendimento/ports/ordem-servico-read.port';
import { PrismaOrdemServicoReadAdapter } from '../../../../infrastructure/database/mysql/repositories/prisma-ordem-servico-read.adapter';

@Module({
  controllers: [ClienteController, VeiculoController],
  providers: [
    { provide: CLIENTE_REPOSITORY, useClass: PrismaClienteRepository },
    { provide: VEICULO_REPOSITORY, useClass: PrismaVeiculoRepository },
    CadastrarClienteUseCase,
    ListarClientesUseCase,
    ObterClienteUseCase,
    AtualizarClienteUseCase,
    InativarClienteUseCase,
    CadastrarVeiculoUseCase,
    ListarVeiculosUseCase,
    ObterVeiculoUseCase,
    AtualizarVeiculoUseCase,
    InativarVeiculoUseCase,
    {
      provide: ORDEM_SERVICO_READ_PORT,
      useClass: PrismaOrdemServicoReadAdapter,
    },
  ],
})
export class CadastroModule {}
