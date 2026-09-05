import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreatePecaDto {
  @ApiProperty({
    description: 'Descrição da peça',
    example: 'Filtro de óleo – universal',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  descricao!: string;

  @ApiProperty({ description: 'Preço unitário (R$)', example: 35.0 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(99999999.99)
  precoUnitario!: number;

  @ApiPropertyOptional({
    description: 'Quantidade inicial em estoque',
    example: 50,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(999999999)
  quantidadeEmEstoque?: number;

  @ApiProperty({
    description:
      'Código interno da peça (letras, números, hífen, ponto ou underscore). Será normalizado para MAIÚSCULAS automaticamente.',
    example: 'FLT-OL-001',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  @Matches(/^[A-Za-z0-9\-_.]+$/, {
    message:
      'codigoInterno deve conter apenas letras, números, hífen, ponto ou underscore',
  })
  codigoInterno!: string;
}
