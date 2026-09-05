import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Cliente } from '../../../domain/cadastro/entities/cliente.entity';
import type { ClienteRepository } from '../../../domain/cadastro/repositories/cliente.repository';
import { CLIENTE_REPOSITORY } from '../../../domain/cadastro/repositories/cliente.repository';

@Injectable()
export class ObterClienteUseCase {
  constructor(
    @Inject(CLIENTE_REPOSITORY)
    private readonly clientes: ClienteRepository,
  ) {}

  async execute(id: string): Promise<Cliente> {
    const c = await this.clientes.findById(id);
    if (!c) {
      throw new NotFoundException('Cliente não encontrado');
    }
    return c;
  }
}
