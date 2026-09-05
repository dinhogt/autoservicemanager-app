import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'E-mail do usuário administrador',
    example: 'joao.silva@autoservice.local',
  })
  @IsEmail()
  @MaxLength(200)
  email!: string;

  @ApiProperty({
    description: 'Senha de acesso (mín. 8 caracteres)',
    example: 'Senha@1234',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}
