import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/** Atualização de cliente — CPF/CNPJ não é alterado após criação. */
export class UpdateClienteDto {
  @ApiPropertyOptional({
    description: 'Nome completo ou razão social',
    example: 'Roberto Almeida Silva',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  nome?: string;

  @ApiPropertyOptional({
    description: 'Telefone ou e-mail de contato',
    example: '(11) 91234-5678',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  contato?: string | null;

  @ApiPropertyOptional({
    description: 'Endereço completo',
    example: 'Av. Brasil, 500 - Centro, São Paulo - SP',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  enderecos?: string | null;
}
