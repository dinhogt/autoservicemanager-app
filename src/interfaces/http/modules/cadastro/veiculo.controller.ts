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
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  AtualizarVeiculoUseCase,
  CadastrarVeiculoUseCase,
  InativarVeiculoUseCase,
  ListarVeiculosUseCase,
  ObterVeiculoUseCase,
} from '../../../../application/cadastro/use-cases';
import { CreateVeiculoDto } from '../../../../application/cadastro/dto/create-veiculo.dto';
import { ListarVeiculosQueryDto } from '../../../../application/cadastro/dto/listar-veiculos-query.dto';
import { UpdateVeiculoDto } from '../../../../application/cadastro/dto/update-veiculo.dto';
import { AppRole } from '../../../../domain/autenticacao/entities/app-role';
import { Roles } from '../../../../infrastructure/auth/roles.decorator';

@ApiTags('Admin — Veículos')
@ApiBearerAuth('JWT-auth')
@Roles(AppRole.ADMIN, AppRole.GERENTE, AppRole.ATENDENTE)
@Controller('admin/veiculos')
export class VeiculoController {
  constructor(
    private readonly cadastrarVeiculo: CadastrarVeiculoUseCase,
    private readonly listarVeiculos: ListarVeiculosUseCase,
    private readonly obterVeiculo: ObterVeiculoUseCase,
    private readonly atualizarVeiculo: AtualizarVeiculoUseCase,
    private readonly inativarVeiculo: InativarVeiculoUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Cadastrar novo veículo vinculado a um cliente' })
  @ApiResponse({ status: 201, description: 'Veículo criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 409, description: 'Placa já cadastrada' })
  create(@Body() dto: CreateVeiculoDto) {
    return this.cadastrarVeiculo.execute(dto);
  }

  @Get()
  @ApiOperation({
    summary:
      'Listar veículos (paginado, opcional filtro por cliente). Use ?incluirInativos=true para listar inativos.',
  })
  @ApiQuery({
    name: 'clienteId',
    required: false,
    description: 'Filtrar veículos de um cliente específico',
  })
  list(@Query() query: ListarVeiculosQueryDto) {
    return this.listarVeiculos.execute(query, query.clienteId, {
      incluirInativos: query.incluirInativos,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter veículo por ID' })
  @ApiParam({ name: 'id', description: 'UUID do veículo' })
  @ApiResponse({ status: 200, description: 'Dados do veículo' })
  @ApiResponse({ status: 404, description: 'Veículo não encontrado' })
  getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.obterVeiculo.execute(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar dados do veículo (marca, modelo, ano)' })
  @ApiParam({ name: 'id', description: 'UUID do veículo' })
  @ApiResponse({ status: 200, description: 'Veículo atualizado' })
  @ApiResponse({ status: 404, description: 'Veículo não encontrado' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVeiculoDto,
  ) {
    return this.atualizarVeiculo.execute(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @Roles(AppRole.ADMIN, AppRole.GERENTE)
  @ApiOperation({
    summary: 'Inativar veículo (soft-delete). Bloqueia se houver OS ativa.',
  })
  @ApiParam({ name: 'id', description: 'UUID do veículo' })
  @ApiResponse({ status: 204, description: 'Veículo inativado' })
  @ApiResponse({ status: 404, description: 'Veículo não encontrado' })
  @ApiResponse({ status: 409, description: 'Veículo possui OS em andamento' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.inativarVeiculo.execute(id);
  }
}
