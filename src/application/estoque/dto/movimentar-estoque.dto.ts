import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, Max, Min } from 'class-validator';

export enum TipoMovimentacaoEstoque {
  ENTRADA = 'entrada',
  SAIDA = 'saida',
}

export class MovimentarEstoqueDto {
  @ApiProperty({
    description: 'Tipo da movimentação',
    enum: TipoMovimentacaoEstoque,
    example: TipoMovimentacaoEstoque.ENTRADA,
  })
  @IsEnum(TipoMovimentacaoEstoque)
  tipo!: TipoMovimentacaoEstoque;

  @ApiProperty({ description: 'Quantidade a movimentar', example: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(999999999)
  quantidade!: number;
}
