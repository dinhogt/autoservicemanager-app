import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { PaginationDto } from './pagination.dto';

/**
 * Pagina\u00e7\u00e3o + flag opcional para listar tamb\u00e9m registros soft-deleted.
 * Usado pelos endpoints administrativos de cadastro/cat\u00e1logo/estoque.
 */
export class PaginationComInativosDto extends PaginationDto {
  @ApiPropertyOptional({
    description:
      'Quando true, inclui registros inativos (soft-deleted) no resultado.',
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  incluirInativos: boolean = false;
}
