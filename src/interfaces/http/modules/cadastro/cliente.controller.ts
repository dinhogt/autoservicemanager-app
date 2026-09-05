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
  AtualizarClienteUseCase,
  CadastrarClienteUseCase,
  InativarClienteUseCase,
  ListarClientesUseCase,
  ObterClienteUseCase,
} from '../../../../application/cadastro/use-cases';
import { CreateClienteDto } from '../../../../application/cadastro/dto/create-cliente.dto';
import { UpdateClienteDto } from '../../../../application/cadastro/dto/update-cliente.dto';
import { PaginationComInativosDto } from '../../../../shared/dto/pagination-com-inativos.dto';
import { AppRole } from '../../../../domain/autenticacao/entities/app-role';
import { Roles } from '../../../../infrastructure/auth/roles.decorator';

@ApiTags('Admin — Clientes')
@ApiBearerAuth('JWT-auth')
@Roles(AppRole.ADMIN, AppRole.GERENTE, AppRole.ATENDENTE)
@Controller('admin/clientes')
export class ClienteController {
  constructor(
    private readonly cadastrarCliente: CadastrarClienteUseCase,
    private readonly listarClientes: ListarClientesUseCase,
    private readonly obterCliente: ObterClienteUseCase,
    private readonly atualizarCliente: AtualizarClienteUseCase,
    private readonly inativarCliente: InativarClienteUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Cadastrar novo cliente' })
  @ApiResponse({ status: 201, description: 'Cliente criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 409, description: 'CPF/CNPJ já cadastrado' })
  create(@Body() dto: CreateClienteDto) {
    return this.cadastrarCliente.execute(dto);
  }

  @Get()
  @ApiOperation({
    summary:
      'Listar clientes (paginado). Use ?incluirInativos=true para também listar clientes inativos.',
  })
  @ApiResponse({ status: 200, description: 'Lista paginada de clientes' })
  list(@Query() query: PaginationComInativosDto) {
    return this.listarClientes.execute(query, {
      incluirInativos: query.incluirInativos,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter cliente por ID' })
  @ApiParam({ name: 'id', description: 'UUID do cliente' })
  @ApiResponse({ status: 200, description: 'Dados do cliente' })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado' })
  getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.obterCliente.execute(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar dados do cliente (CPF/CNPJ não é alterável)',
  })
  @ApiParam({ name: 'id', description: 'UUID do cliente' })
  @ApiResponse({ status: 200, description: 'Cliente atualizado' })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateClienteDto,
  ) {
    return this.atualizarCliente.execute(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @Roles(AppRole.ADMIN, AppRole.GERENTE)
  @ApiOperation({
    summary: 'Inativar cliente (soft-delete). Bloqueia se houver OS ativa.',
  })
  @ApiParam({ name: 'id', description: 'UUID do cliente' })
  @ApiResponse({ status: 204, description: 'Cliente inativado' })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado' })
  @ApiResponse({ status: 409, description: 'Cliente possui OS em andamento' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.inativarCliente.execute(id);
  }
}
