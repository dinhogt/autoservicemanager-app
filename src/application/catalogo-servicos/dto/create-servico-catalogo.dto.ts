import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateServicoCatalogoDto {
  @ApiProperty({
    description: 'Descrição do serviço oferecido',
    example: 'Troca de óleo e filtro',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  descricao!: string;

  @ApiProperty({ description: 'Preço base do serviço (R$)', example: 150.0 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(99999999.99)
  precoBase!: number;

  @ApiProperty({
    description: 'Tempo médio de execução em minutos',
    example: 30,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(24 * 60)
  tempoMedioExecucao!: number;
}
