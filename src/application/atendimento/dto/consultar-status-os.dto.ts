import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * Valida CPF/CNPJ pela quantidade de dígitos após remover pontuação.
 * Não depende de @Transform (evita falhas quando o metadata do class-transformer
 * não é aplicado no build).
 */
@ValidatorConstraint({ name: 'cpfCnpjQueryDigitsPattern', async: false })
export class CpfCnpjQueryDigitsPatternConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (value === undefined || value === null) return true;
    let raw: unknown = value;
    if (Array.isArray(value)) {
      raw = value[0] as unknown;
    }
    if (raw === undefined || raw === null) return true;
    if (typeof raw !== 'string' && typeof raw !== 'number') return false;
    const trimmed = String(raw).trim();
    if (trimmed === '') return true;
    const digits = trimmed.replace(/\D/g, '');
    return /^\d{11}(\d{3})?$/.test(digits);
  }

  defaultMessage(): string {
    return 'cpfCnpj deve conter 11 dígitos (CPF) ou 14 dígitos (CNPJ), somente números';
  }
}

export class ConsultarStatusOsDto {
  @ApiPropertyOptional({
    description:
      'CPF (11 dígitos) ou CNPJ (14 dígitos); números ou formatado (pontuação é ignorada)',
    example: '52998224725',
  })
  @IsOptional()
  @Validate(CpfCnpjQueryDigitsPatternConstraint)
  cpfCnpj?: string;

  @ApiPropertyOptional({ description: 'Placa do veículo', example: 'BRA2E19' })
  @IsOptional()
  @IsString()
  @MinLength(7)
  @MaxLength(8)
  placa?: string;
}
