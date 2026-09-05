import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpdatePecaDto {
  @ApiPropertyOptional({
    description: 'Descrição da peça',
    example: 'Filtro de óleo premium – universal',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  descricao?: string;

  @ApiPropertyOptional({ description: 'Preço unitário (R$)', example: 42.5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(99999999.99)
  precoUnitario?: number;
}
