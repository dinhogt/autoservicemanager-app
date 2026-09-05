import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateServicoCatalogoDto {
  @ApiPropertyOptional({
    description: 'Descrição do serviço oferecido',
    example: 'Alinhamento e balanceamento completo',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  descricao?: string;

  @ApiPropertyOptional({
    description: 'Preço base do serviço (R$)',
    example: 200.0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(99999999.99)
  precoBase?: number;

  @ApiPropertyOptional({
    description: 'Tempo médio de execução em minutos',
    example: 75,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(24 * 60)
  tempoMedioExecucao?: number;
}
