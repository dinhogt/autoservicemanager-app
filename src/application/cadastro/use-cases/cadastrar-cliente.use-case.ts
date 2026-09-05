import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { Cliente } from '../../../domain/cadastro/entities/cliente.entity';
import { CpfCnpj } from '../../../domain/cadastro/value-objects/cpf-cnpj.vo';
import type { ClienteRepository } from '../../../domain/cadastro/repositories/cliente.repository';
import { CLIENTE_REPOSITORY } from '../../../domain/cadastro/repositories/cliente.repository';
import { handleDomainValidation } from '../../../shared/errors/handle-domain-exception';
import { CreateClienteDto } from '../dto/create-cliente.dto';

@Injectable()
export class CadastrarClienteUseCase {
  constructor(
    @Inject(CLIENTE_REPOSITORY)
    private readonly clientes: ClienteRepository,
  ) {}

  async execute(dto: CreateClienteDto): Promise<Cliente> {
    const cpf = handleDomainValidation(() => CpfCnpj.create(dto.cpfCnpj));
    const existing = await this.clientes.findByCpfCnpj(cpf.value);
    if (existing) {
      throw new ConflictException('Cliente já cadastrado com este CPF/CNPJ');
    }
    return this.clientes.create({
      nome: dto.nome,
      cpfCnpj: cpf.value,
      contato: dto.contato ?? null,
      enderecos: dto.enderecos ?? null,
    });
  }
}
