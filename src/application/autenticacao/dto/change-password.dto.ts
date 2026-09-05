import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ description: 'Senha atual do usuário', example: 'Senha@1234' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  currentPassword!: string;

  @ApiProperty({
    description:
      'Nova senha desejada (mín. 8 caracteres, deve conter maiúscula, minúscula, número e caractere especial)',
    example: 'NovaSenha@5678',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/, {
    message:
      'newPassword deve conter ao menos uma letra maiúscula, uma minúscula, um número e um caractere especial',
  })
  newPassword!: string;
}
