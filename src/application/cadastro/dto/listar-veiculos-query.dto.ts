import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationComInativosDto } from '../../../shared/dto/pagination-com-inativos.dto';

export class ListarVeiculosQueryDto extends PaginationComInativosDto {
  @ApiPropertyOptional({
    description: 'Filtrar veículos de um cliente específico',
  })
  @IsOptional()
  @IsUUID()
  clienteId?: string;
}
