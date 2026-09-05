import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateVeiculoDto {
  @ApiProperty({
    description: 'ID do cliente proprietário',
    example: '550e8400-e29b-41d4-a716-446655440101',
  })
  @IsUUID()
  clienteId!: string;

  @ApiProperty({
    description: 'Placa do veículo (formato Mercosul ou antigo)',
    example: 'BRA2E19',
  })
  @IsString()
  @MinLength(7)
  @MaxLength(8)
  placa!: string;

  @ApiPropertyOptional({ description: 'Marca do fabricante', example: 'Fiat' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  marca?: string;

  @ApiPropertyOptional({
    description: 'Modelo do veículo',
    example: 'Uno 1.0 Fire',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  modelo?: string;

  @ApiPropertyOptional({ description: 'Ano de fabricação', example: 2019 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(2100)
  ano?: number;
}
