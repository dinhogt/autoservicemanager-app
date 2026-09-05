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
  AtualizarPecaUseCase,
  CadastrarPecaUseCase,
  InativarPecaUseCase,
  ListarPecasUseCase,
  MovimentarEstoquePecaUseCase,
  ObterPecaUseCase,
} from '../../../../application/estoque/use-cases';
import { CreatePecaDto } from '../../../../application/estoque/dto/create-peca.dto';
import { MovimentarEstoqueDto } from '../../../../application/estoque/dto/movimentar-estoque.dto';
import { UpdatePecaDto } from '../../../../application/estoque/dto/update-peca.dto';
import { PaginationComInativosDto } from '../../../../shared/dto/pagination-com-inativos.dto';
import { AppRole } from '../../../../domain/autenticacao/entities/app-role';
import { Roles } from '../../../../infrastructure/auth/roles.decorator';

@ApiTags('Admin — Peças e estoque')
@ApiBearerAuth('JWT-auth')
@Roles(AppRole.ADMIN, AppRole.GERENTE)
@Controller('admin/pecas')
export class PecaController {
  constructor(
    private readonly cadastrarPeca: CadastrarPecaUseCase,
    private readonly listarPecas: ListarPecasUseCase,
    private readonly obterPeca: ObterPecaUseCase,
    private readonly atualizarPeca: AtualizarPecaUseCase,
    private readonly movimentarEstoque: MovimentarEstoquePecaUseCase,
    private readonly inativarPeca: InativarPecaUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Cadastrar nova peça no estoque' })
  @ApiResponse({ status: 201, description: 'Peça criada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 409, description: 'Código interno já cadastrado' })
  create(@Body() dto: CreatePecaDto) {
    return this.cadastrarPeca.execute(dto);
  }

  @Get()
  @ApiOperation({
    summary:
      'Listar peças em estoque (paginado). Use ?incluirInativos=true para listar inativas.',
  })
  @ApiResponse({ status: 200, description: 'Lista paginada de peças' })
  list(@Query() query: PaginationComInativosDto) {
    return this.listarPecas.execute(query, {
      incluirInativos: query.incluirInativos,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter peça por ID' })
  @ApiParam({ name: 'id', description: 'UUID da peça' })
  @ApiResponse({ status: 200, description: 'Dados da peça' })
  @ApiResponse({ status: 404, description: 'Peça não encontrada' })
  getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.obterPeca.execute(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar dados da peça (descrição, preço)' })
  @ApiParam({ name: 'id', description: 'UUID da peça' })
  @ApiResponse({ status: 200, description: 'Peça atualizada' })
  @ApiResponse({ status: 404, description: 'Peça não encontrada' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePecaDto) {
    return this.atualizarPeca.execute(id, dto);
  }

  @Post(':id/movimentacoes')
  @ApiOperation({ summary: 'Registrar entrada ou saída de estoque' })
  @ApiParam({ name: 'id', description: 'UUID da peça' })
  @ApiResponse({ status: 201, description: 'Movimentação registrada' })
  @ApiResponse({
    status: 400,
    description: 'Estoque insuficiente para saída ou dados inválidos',
  })
  @ApiResponse({ status: 404, description: 'Peça não encontrada' })
  movimentar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MovimentarEstoqueDto,
  ) {
    return this.movimentarEstoque.execute(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({
    summary:
      'Inativar peça (soft-delete). Bloqueia se houver reservas ativas em OS.',
  })
  @ApiParam({ name: 'id', description: 'UUID da peça' })
  @ApiResponse({ status: 204, description: 'Peça inativada' })
  @ApiResponse({ status: 404, description: 'Peça não encontrada' })
  @ApiResponse({ status: 409, description: 'Peça com reservas ativas' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.inativarPeca.execute(id);
  }
}
