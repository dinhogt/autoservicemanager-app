import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

/** Serviço a incluir na OS. O preço aplicado é derivado automaticamente do catálogo. */
export class CreateItemServicoOsDto {
  @ApiProperty({
    description: 'ID do serviço no catálogo',
    example: '550e8400-e29b-41d4-a716-446655440301',
  })
  @IsUUID()
  servicoCatalogoId!: string;

  @ApiProperty({ description: 'Quantidade do serviço', example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(999)
  quantidade!: number;
}

/** Peça a incluir na OS. O preço unitário é derivado automaticamente do estoque. */
export class CreateItemPecaOsDto {
  @ApiProperty({
    description: 'ID da peça no estoque',
    example: '550e8400-e29b-41d4-a716-446655440401',
  })
  @IsUUID()
  pecaEstoqueId!: string;

  @ApiProperty({ description: 'Quantidade de peças', example: 2 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(999)
  quantidade!: number;
}

export class CreateOrdemServicoDto {
  @ApiProperty({
    description: 'ID do cliente',
    example: '550e8400-e29b-41d4-a716-446655440101',
  })
  @IsUUID()
  clienteId!: string;

  @ApiProperty({
    description: 'ID do veículo do cliente',
    example: '550e8400-e29b-41d4-a716-446655440201',
  })
  @IsUUID()
  veiculoId!: string;

  @ApiPropertyOptional({
    description:
      'Serviços a incluir na OS. Preços são calculados automaticamente a partir do catálogo.',
    type: [CreateItemServicoOsDto],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => CreateItemServicoOsDto)
  itensServico?: CreateItemServicoOsDto[];

  @ApiPropertyOptional({
    description:
      'Peças a incluir na OS. Preços unitários são calculados automaticamente a partir do estoque.',
    type: [CreateItemPecaOsDto],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => CreateItemPecaOsDto)
  itensPeca?: CreateItemPecaOsDto[];
}
