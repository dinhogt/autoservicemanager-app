import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Veiculo } from '../../../domain/cadastro/entities/veiculo.entity';
import type { VeiculoRepository } from '../../../domain/cadastro/repositories/veiculo.repository';
import { VEICULO_REPOSITORY } from '../../../domain/cadastro/repositories/veiculo.repository';
import { UpdateVeiculoDto } from '../dto/update-veiculo.dto';

@Injectable()
export class AtualizarVeiculoUseCase {
  constructor(
    @Inject(VEICULO_REPOSITORY)
    private readonly veiculos: VeiculoRepository,
  ) {}

  async execute(id: string, dto: UpdateVeiculoDto): Promise<Veiculo> {
    const existing = await this.veiculos.findById(id);
    if (!existing) {
      throw new NotFoundException('Veículo não encontrado');
    }
    const patch: Partial<{
      marca: string | null;
      modelo: string | null;
      ano: number | null;
    }> = {};
    if (dto.marca !== undefined) patch.marca = dto.marca;
    if (dto.modelo !== undefined) patch.modelo = dto.modelo;
    if (dto.ano !== undefined) patch.ano = dto.ano;
    if (Object.keys(patch).length === 0) {
      return existing;
    }
    return this.veiculos.update(id, patch);
  }
}
