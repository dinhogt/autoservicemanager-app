import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateVeiculoDto {
  @ApiPropertyOptional({
    description: 'Marca do fabricante',
    example: 'Volkswagen',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  marca?: string | null;

  @ApiPropertyOptional({
    description: 'Modelo do veículo',
    example: 'Gol 1.6 MSI',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  modelo?: string | null;

  @ApiPropertyOptional({
    description: 'Ano de fabricação',
    example: 2021,
    nullable: true,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(2100)
  ano?: number | null;
}
