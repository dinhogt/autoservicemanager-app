import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AppRole } from '../../../../domain/autenticacao/entities/app-role';
import { RoleAdmin } from '../../../../domain/autenticacao/entities/usuario-admin.entity';
import { Roles } from '../../../../infrastructure/auth/roles.decorator';
import {
  CriarUsuarioUseCase,
  ListarUsuariosUseCase,
  ObterUsuarioUseCase,
  AtualizarUsuarioUseCase,
  AlterarSenhaUseCase,
} from '../../../../application/autenticacao/use-cases';
import { CreateUsuarioDto } from '../../../../application/autenticacao/dto/create-usuario.dto';
import { UpdateUsuarioDto } from '../../../../application/autenticacao/dto/update-usuario.dto';
import { ChangePasswordDto } from '../../../../application/autenticacao/dto/change-password.dto';
import { PaginationDto } from '../../../../shared/dto/pagination.dto';

type AuthRequest = { user: { userId: string; email: string; role: RoleAdmin } };

@ApiTags('Admin — Usuários')
@ApiBearerAuth('JWT-auth')
@Controller('admin/usuarios')
export class UsuarioController {
  constructor(
    private readonly criarUsuario: CriarUsuarioUseCase,
    private readonly listarUsuarios: ListarUsuariosUseCase,
    private readonly obterUsuario: ObterUsuarioUseCase,
    private readonly atualizarUsuario: AtualizarUsuarioUseCase,
    private readonly alterarSenha: AlterarSenhaUseCase,
  ) {}

  @Post()
  @Roles(AppRole.ADMIN)
  @ApiOperation({ summary: 'Criar novo usuário do sistema' })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão (requer ADMIN)' })
  @ApiResponse({ status: 409, description: 'E-mail já cadastrado' })
  create(@Body() dto: CreateUsuarioDto) {
    return this.criarUsuario.execute(dto);
  }

  @Get()
  @Roles(AppRole.ADMIN, AppRole.GERENTE)
  @ApiOperation({ summary: 'Listar usuários do sistema (paginado)' })
  @ApiResponse({ status: 200, description: 'Lista paginada de usuários' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão (requer ADMIN ou GERENTE)',
  })
  list(@Query() pagination: PaginationDto) {
    return this.listarUsuarios.execute(pagination);
  }

  @Get(':id')
  @Roles(AppRole.ADMIN, AppRole.GERENTE)
  @ApiOperation({ summary: 'Obter usuário por ID' })
  @ApiParam({
    name: 'id',
    description: 'UUID do usuário',
    example: '550e8400-e29b-41d4-a716-446655440501',
  })
  @ApiResponse({ status: 200, description: 'Dados do usuário' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.obterUsuario.execute(id);
  }

  @Patch(':id')
  @Roles(AppRole.ADMIN)
  @ApiOperation({ summary: 'Atualizar dados de um usuário' })
  @ApiParam({ name: 'id', description: 'UUID do usuário' })
  @ApiResponse({ status: 200, description: 'Usuário atualizado' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUsuarioDto,
  ) {
    return this.atualizarUsuario.execute(id, dto);
  }

  @Patch(':id/senha')
  @ApiOperation({ summary: 'Alterar senha (próprio usuário ou ADMIN)' })
  @ApiParam({ name: 'id', description: 'UUID do usuário' })
  @ApiResponse({ status: 200, description: 'Senha alterada com sucesso' })
  @ApiResponse({
    status: 400,
    description: 'Senha atual incorreta ou dados inválidos',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para alterar a senha deste usuário',
  })
  changePassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangePasswordDto,
    @Req() req: AuthRequest,
  ) {
    const isOwnAccount = req.user.userId === id;
    const isAdmin = req.user.role === RoleAdmin.ADMIN;
    if (!isOwnAccount && !isAdmin) {
      throw new ForbiddenException(
        'Apenas o próprio usuário ou ADMIN pode alterar a senha',
      );
    }
    return this.alterarSenha.execute(id, dto);
  }
}
