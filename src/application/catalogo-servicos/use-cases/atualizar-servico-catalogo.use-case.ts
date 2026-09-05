import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ServicoCatalogo } from '../../../domain/catalogo-servicos/entities/servico-catalogo.entity';
import type { ServicoCatalogoRepository } from '../../../domain/catalogo-servicos/repositories/servico-catalogo.repository';
import { SERVICO_CATALOGO_REPOSITORY } from '../../../domain/catalogo-servicos/repositories/servico-catalogo.repository';
import { UpdateServicoCatalogoDto } from '../dto/update-servico-catalogo.dto';

@Injectable()
export class AtualizarServicoCatalogoUseCase {
  constructor(
    @Inject(SERVICO_CATALOGO_REPOSITORY)
    private readonly servicos: ServicoCatalogoRepository,
  ) {}

  async execute(
    id: string,
    dto: UpdateServicoCatalogoDto,
  ): Promise<ServicoCatalogo> {
    const existing = await this.servicos.findById(id);
    if (!existing) {
      throw new NotFoundException('Serviço do catálogo não encontrado');
    }
    const patch: Partial<{
      descricao: string;
      precoBase: number;
      tempoMedioExecucao: number;
    }> = {};
    if (dto.descricao !== undefined) patch.descricao = dto.descricao;
    if (dto.precoBase !== undefined) patch.precoBase = dto.precoBase;
    if (dto.tempoMedioExecucao !== undefined) {
      patch.tempoMedioExecucao = dto.tempoMedioExecucao;
    }
    if (Object.keys(patch).length === 0) {
      return existing;
    }
    return this.servicos.update(id, patch);
  }
}
