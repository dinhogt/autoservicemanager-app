import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { RoleAdmin } from '../../../domain/autenticacao/entities/usuario-admin.entity';

export class CreateUsuarioDto {
  @ApiProperty({
    description: 'Nome completo do usuário',
    example: 'Carlos Santos',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  nome!: string;

  @ApiProperty({
    description: 'E-mail institucional (será usado como login)',
    example: 'carlos.santos@autoservice.local',
  })
  @IsEmail()
  @MaxLength(200)
  email!: string;

  @ApiProperty({
    description:
      'Senha de acesso (mín. 8 caracteres, deve conter maiúscula, minúscula, número e caractere especial)',
    example: 'Senha@1234',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/, {
    message:
      'password deve conter ao menos uma letra maiúscula, uma minúscula, um número e um caractere especial',
  })
  password!: string;

  @ApiPropertyOptional({
    description: 'Perfil de acesso',
    enum: RoleAdmin,
    example: RoleAdmin.MECANICO,
  })
  @IsOptional()
  @IsEnum(RoleAdmin)
  role?: RoleAdmin;
}
