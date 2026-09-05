import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Veiculo } from '../../../domain/cadastro/entities/veiculo.entity';
import type { VeiculoRepository } from '../../../domain/cadastro/repositories/veiculo.repository';
import { VEICULO_REPOSITORY } from '../../../domain/cadastro/repositories/veiculo.repository';

@Injectable()
export class ObterVeiculoUseCase {
  constructor(
    @Inject(VEICULO_REPOSITORY)
    private readonly veiculos: VeiculoRepository,
  ) {}

  async execute(id: string): Promise<Veiculo> {
    const v = await this.veiculos.findById(id);
    if (!v) {
      throw new NotFoundException('Veículo não encontrado');
    }
    return v;
  }
}
