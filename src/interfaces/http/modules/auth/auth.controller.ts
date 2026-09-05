import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LoginAdminUseCase } from '../../../../application/autenticacao/use-cases/login-admin.use-case';
import { LoginDto } from '../../../../application/autenticacao/dto/login.dto';
import { Public } from '../../../../infrastructure/auth/public.decorator';

@ApiTags('Autenticação')
@Public()
@Controller('auth')
export class AuthController {
  constructor(private readonly loginAdmin: LoginAdminUseCase) {}

  @Post('login')
  @ApiOperation({ summary: 'Login de administrador (retorna JWT)' })
  @ApiResponse({ status: 201, description: 'Token JWT gerado com sucesso' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  login(@Body() dto: LoginDto) {
    return this.loginAdmin.execute(dto);
  }
}
