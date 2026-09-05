import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ServicoCatalogo } from '../../../domain/catalogo-servicos/entities/servico-catalogo.entity';
import type { ServicoCatalogoRepository } from '../../../domain/catalogo-servicos/repositories/servico-catalogo.repository';
import { SERVICO_CATALOGO_REPOSITORY } from '../../../domain/catalogo-servicos/repositories/servico-catalogo.repository';

@Injectable()
export class ObterServicoCatalogoUseCase {
  constructor(
    @Inject(SERVICO_CATALOGO_REPOSITORY)
    private readonly servicos: ServicoCatalogoRepository,
  ) {}

  async execute(id: string): Promise<ServicoCatalogo> {
    const s = await this.servicos.findById(id);
    if (!s) {
      throw new NotFoundException('Serviço do catálogo não encontrado');
    }
    return s;
  }
}
