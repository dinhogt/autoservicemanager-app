import { Injectable, Inject } from '@nestjs/common';
import { ServicoCatalogo } from '../../../domain/catalogo-servicos/entities/servico-catalogo.entity';
import type { ServicoCatalogoRepository } from '../../../domain/catalogo-servicos/repositories/servico-catalogo.repository';
import { SERVICO_CATALOGO_REPOSITORY } from '../../../domain/catalogo-servicos/repositories/servico-catalogo.repository';
import { CreateServicoCatalogoDto } from '../dto/create-servico-catalogo.dto';

@Injectable()
export class CadastrarServicoCatalogoUseCase {
  constructor(
    @Inject(SERVICO_CATALOGO_REPOSITORY)
    private readonly servicos: ServicoCatalogoRepository,
  ) {}

  async execute(dto: CreateServicoCatalogoDto): Promise<ServicoCatalogo> {
    return this.servicos.create({
      descricao: dto.descricao,
      precoBase: dto.precoBase,
      tempoMedioExecucao: dto.tempoMedioExecucao,
    });
  }
}
