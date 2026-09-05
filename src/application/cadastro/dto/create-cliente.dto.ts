import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateClienteDto {
  @ApiProperty({
    description: 'Nome completo ou razão social',
    example: 'Roberto Almeida',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  nome!: string;

  @ApiProperty({
    description: 'CPF (11 dígitos) ou CNPJ (14 dígitos), somente números',
    example: '52998224725',
    minLength: 11,
    maxLength: 14,
  })
  @IsString()
  @MinLength(11)
  @MaxLength(14)
  @Matches(/^\d{11}(\d{3})?$/, {
    message:
      'cpfCnpj deve conter 11 dígitos (CPF) ou 14 dígitos (CNPJ), somente números',
  })
  cpfCnpj!: string;

  @ApiPropertyOptional({
    description: 'Telefone ou e-mail de contato',
    example: '(11) 98765-4321',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  contato?: string;

  @ApiPropertyOptional({
    description: 'Endereço completo',
    example: 'Rua Augusta, 1200 - Consolação, São Paulo - SP, 01304-001',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  enderecos?: string;
}
