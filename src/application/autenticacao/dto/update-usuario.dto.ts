import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { RoleAdmin } from '../../../domain/autenticacao/entities/usuario-admin.entity';

export class UpdateUsuarioDto {
  @ApiPropertyOptional({
    description: 'Nome completo do usuário',
    example: 'Carlos Santos Jr.',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  nome?: string;

  @ApiPropertyOptional({
    description: 'E-mail institucional',
    example: 'carlos.jr@autoservice.local',
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(200)
  email?: string;

  @ApiPropertyOptional({
    description: 'Perfil de acesso',
    enum: RoleAdmin,
    example: RoleAdmin.GERENTE,
  })
  @IsOptional()
  @IsEnum(RoleAdmin)
  role?: RoleAdmin;

  @ApiPropertyOptional({
    description: 'Se o usuário está ativo no sistema',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
