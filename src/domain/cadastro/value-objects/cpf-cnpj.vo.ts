import { DomainException } from '../../../shared/errors/domain.exception';
import {
  isValidCpfCnpj,
  onlyDigits,
} from '../../../shared/utils/cpf-cnpj.util';

/** CPF ou CNPJ armazenado apenas com dígitos. */
export class CpfCnpj {
  private constructor(public readonly value: string) {}

  static create(raw: string): CpfCnpj {
    const digits = onlyDigits(raw);
    if (!isValidCpfCnpj(digits)) {
      throw new DomainException('CPF ou CNPJ inválido', 'INVALID_CPF_CNPJ');
    }
    return new CpfCnpj(digits);
  }

  /** Para buscas quando o valor já foi validado (ex.: vindo do banco). */
  static fromStored(digits: string): CpfCnpj {
    return new CpfCnpj(digits);
  }
}
