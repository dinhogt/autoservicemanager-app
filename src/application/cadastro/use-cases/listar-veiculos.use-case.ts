import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Veiculo } from '../../../domain/cadastro/entities/veiculo.entity';
import type { VeiculoRepository } from '../../../domain/cadastro/repositories/veiculo.repository';
import { VEICULO_REPOSITORY } from '../../../domain/cadastro/repositories/veiculo.repository';
import {
  PaginatedResult,
  PaginationDto,
} from '../../../shared/dto/pagination.dto';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class ListarVeiculosUseCase {
  constructor(
    @Inject(VEICULO_REPOSITORY)
    private readonly veiculos: VeiculoRepository,
  ) {}

  async execute(
    pagination: PaginationDto,
    clienteId?: string,
    options?: { incluirInativos?: boolean },
  ): Promise<PaginatedResult<Veiculo>> {
    const incluirInativos = options?.incluirInativos ?? false;

    if (clienteId !== undefined && clienteId !== '') {
      if (!UUID_RE.test(clienteId)) {
        throw new BadRequestException(
          'Query clienteId deve ser um UUID válido',
        );
      }
      const data = await this.veiculos.findByClienteId(clienteId, {
        incluirInativos,
      });
      return {
        data,
        meta: {
          total: data.length,
          page: 1,
          limit: data.length || pagination.limit,
          totalPages: 1,
        },
      };
    }

    const filter = { incluirInativos };
    const [data, total] = await Promise.all([
      this.veiculos.findAll(
        { skip: pagination.skip, take: pagination.limit },
        filter,
      ),
      this.veiculos.count(filter),
    ]);

    return {
      data,
      meta: {
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  }
}
