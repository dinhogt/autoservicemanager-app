import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  AtualizarServicoCatalogoUseCase,
  CadastrarServicoCatalogoUseCase,
  InativarServicoCatalogoUseCase,
  ListarServicosCatalogoUseCase,
  ObterServicoCatalogoUseCase,
} from '../../../../application/catalogo-servicos/use-cases';
import { CreateServicoCatalogoDto } from '../../../../application/catalogo-servicos/dto/create-servico-catalogo.dto';
import { UpdateServicoCatalogoDto } from '../../../../application/catalogo-servicos/dto/update-servico-catalogo.dto';
import { PaginationComInativosDto } from '../../../../shared/dto/pagination-com-inativos.dto';
import { AppRole } from '../../../../domain/autenticacao/entities/app-role';
import { Roles } from '../../../../infrastructure/auth/roles.decorator';

@ApiTags('Admin — Catálogo de serviços')
@ApiBearerAuth('JWT-auth')
@Roles(AppRole.ADMIN, AppRole.GERENTE)
@Controller('admin/servicos')
export class ServicoCatalogoController {
  constructor(
    private readonly cadastrar: CadastrarServicoCatalogoUseCase,
    private readonly listar: ListarServicosCatalogoUseCase,
    private readonly obter: ObterServicoCatalogoUseCase,
    private readonly atualizar: AtualizarServicoCatalogoUseCase,
    private readonly inativar: InativarServicoCatalogoUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Cadastrar novo serviço no catálogo' })
  @ApiResponse({ status: 201, description: 'Serviço criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  create(@Body() dto: CreateServicoCatalogoDto) {
    return this.cadastrar.execute(dto);
  }

  @Get()
  @ApiOperation({
    summary:
      'Listar serviços do catálogo (paginado). Use ?incluirInativos=true para listar inativos.',
  })
  @ApiResponse({ status: 200, description: 'Lista paginada de serviços' })
  list(@Query() query: PaginationComInativosDto) {
    return this.listar.execute(query, {
      incluirInativos: query.incluirInativos,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter serviço por ID' })
  @ApiParam({ name: 'id', description: 'UUID do serviço' })
  @ApiResponse({ status: 200, description: 'Dados do serviço' })
  @ApiResponse({ status: 404, description: 'Serviço não encontrado' })
  getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.obter.execute(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar serviço do catálogo' })
  @ApiParam({ name: 'id', description: 'UUID do serviço' })
  @ApiResponse({ status: 200, description: 'Serviço atualizado' })
  @ApiResponse({ status: 404, description: 'Serviço não encontrado' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateServicoCatalogoDto,
  ) {
    return this.atualizar.execute(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({
    summary:
      'Inativar serviço do catálogo (soft-delete). Bloqueia se houver OS em andamento usando o serviço.',
  })
  @ApiParam({ name: 'id', description: 'UUID do serviço' })
  @ApiResponse({ status: 204, description: 'Serviço inativado' })
  @ApiResponse({ status: 404, description: 'Serviço não encontrado' })
  @ApiResponse({
    status: 409,
    description: 'Serviço vinculado a OS em andamento',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.inativar.execute(id);
  }
}
