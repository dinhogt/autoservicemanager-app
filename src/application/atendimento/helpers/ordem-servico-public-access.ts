import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CpfCnpj } from '../../../domain/cadastro/value-objects/cpf-cnpj.vo';
import { Placa } from '../../../domain/cadastro/value-objects/placa.vo';
import { OrdemServicoRepository } from '../../../domain/atendimento/repositories/ordem-servico.repository';
import { handleDomainValidation } from '../../../shared/errors/handle-domain-exception';
import { ConsultarStatusOsDto } from '../dto/consultar-status-os.dto';
import { OrdemServicoComClienteVeiculo } from '../../../domain/atendimento/types/ordem-servico-read.types';

export async function carregarOrdemServicoComValidacaoPublica(
  ordens: Pick<OrdemServicoRepository, 'findWithClienteVeiculoById'>,
  id: string,
  query: ConsultarStatusOsDto,
): Promise<OrdemServicoComClienteVeiculo> {
  if (!query.cpfCnpj && !query.placa) {
    throw new BadRequestException(
      'Informe cpfCnpj ou placa para validar o acesso',
    );
  }

  const os = await ordens.findWithClienteVeiculoById(id);
  if (!os) {
    throw new NotFoundException('Ordem de serviço não encontrada');
  }

  const cpfNormalized = query.cpfCnpj
    ? handleDomainValidation(() => CpfCnpj.create(query.cpfCnpj!)).value
    : undefined;

  const placaNormalized = query.placa
    ? handleDomainValidation(() => Placa.create(query.placa!)).value
    : undefined;

  const okByCpf =
    cpfNormalized !== undefined && os.cliente.cpfCnpj === cpfNormalized;
  const okByPlaca =
    placaNormalized !== undefined && os.veiculo.placa === placaNormalized;

  if (!okByCpf && !okByPlaca) {
    throw new NotFoundException('Ordem de serviço não encontrada');
  }

  return os;
}
