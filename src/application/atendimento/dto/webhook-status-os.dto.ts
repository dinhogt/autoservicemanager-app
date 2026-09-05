import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StatusOs } from '../../../domain/atendimento/value-objects/status-os.enum';

export class WebhookStatusOsDto {
  @ApiProperty({
    enum: StatusOs,
    example: StatusOs.EM_DIAGNOSTICO,
    description: 'Novo status desejado para a OS',
  })
  @IsEnum(StatusOs)
  status!: StatusOs;
}
