import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class AprovacaoOrcamentoDto {
  @ApiProperty({
    description: 'true para aprovar o orçamento, false para rejeitar',
    example: true,
  })
  @IsBoolean()
  aprovado!: boolean;
}
