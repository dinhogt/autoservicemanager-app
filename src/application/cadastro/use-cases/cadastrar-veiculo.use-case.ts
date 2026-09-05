import {
  BadRequestException,
  ConflictException,
  Injectable,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { Veiculo } from '../../../domain/cadastro/entities/veiculo.entity';
import { Placa } from '../../../domain/cadastro/value-objects/placa.vo';
import type { ClienteRepository } from '../../../domain/cadastro/repositories/cliente.repository';
import { CLIENTE_REPOSITORY } from '../../../domain/cadastro/repositories/cliente.repository';
import type { VeiculoRepository } from '../../../domain/cadastro/repositories/veiculo.repository';
import { VEICULO_REPOSITORY } from '../../../domain/cadastro/repositories/veiculo.repository';
import { handleDomainValidation } from '../../../shared/errors/handle-domain-exception';
import { CreateVeiculoDto } from '../dto/create-veiculo.dto';

@Injectable()
export class CadastrarVeiculoUseCase {
  constructor(
    @Inject(CLIENTE_REPOSITORY)
    private readonly clientes: ClienteRepository,
    @Inject(VEICULO_REPOSITORY)
    private readonly veiculos: VeiculoRepository,
  ) {}

  async execute(dto: CreateVeiculoDto): Promise<Veiculo> {
    const cliente = await this.clientes.findById(dto.clienteId);
    if (!cliente) {
      throw new NotFoundException('Cliente não encontrado');
    }
    if (!cliente.ativo) {
      throw new BadRequestException(
        'Cliente está inativo; não é possível cadastrar veículo',
      );
    }
    const placa = handleDomainValidation(() => Placa.create(dto.placa));
    const dup = await this.veiculos.findByPlaca(placa.value);
    if (dup) {
      throw new ConflictException('Já existe veículo com esta placa');
    }
    return this.veiculos.create({
      clienteId: dto.clienteId,
      placa: placa.value,
      marca: dto.marca ?? null,
      modelo: dto.modelo ?? null,
      ano: dto.ano ?? null,
    });
  }
}
