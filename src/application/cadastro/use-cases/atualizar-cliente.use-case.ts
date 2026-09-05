import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Cliente } from '../../../domain/cadastro/entities/cliente.entity';
import type { ClienteRepository } from '../../../domain/cadastro/repositories/cliente.repository';
import { CLIENTE_REPOSITORY } from '../../../domain/cadastro/repositories/cliente.repository';
import { UpdateClienteDto } from '../dto/update-cliente.dto';

@Injectable()
export class AtualizarClienteUseCase {
  constructor(
    @Inject(CLIENTE_REPOSITORY)
    private readonly clientes: ClienteRepository,
  ) {}

  async execute(id: string, dto: UpdateClienteDto): Promise<Cliente> {
    const existing = await this.clientes.findById(id);
    if (!existing) {
      throw new NotFoundException('Cliente não encontrado');
    }
    const patch: Partial<{
      nome: string;
      contato: string | null;
      enderecos: string | null;
    }> = {};
    if (dto.nome !== undefined) patch.nome = dto.nome;
    if (dto.contato !== undefined) patch.contato = dto.contato;
    if (dto.enderecos !== undefined) patch.enderecos = dto.enderecos;
    if (Object.keys(patch).length === 0) {
      return existing;
    }
    return this.clientes.update(id, patch);
  }
}
