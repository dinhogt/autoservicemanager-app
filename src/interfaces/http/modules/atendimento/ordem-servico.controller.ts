import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  AprovarOrcamentoUseCase,
  ConsultarStatusOsUseCase,
  CriarOrdemServicoUseCase,
  EntregarVeiculoUseCase,
  GerarOrcamentoUseCase,
  IniciarDiagnosticoUseCase,
  ListarOrdensServicoUseCase,
  ObterOrdemServicoUseCase,
  ObterTempoMedioExecucaoUseCase,
  FinalizarOsUseCase,
  ListarHistoricoOsUseCase,
} from '../../../../application/atendimento/use-cases';
import {
  AprovacaoOrcamentoDto,
  CreateOrdemServicoDto,
} from '../../../../application/atendimento/dto';
import { Public } from '../../../../infrastructure/auth/public.decorator';
import { PaginationDto } from '../../../../shared/dto/pagination.dto';
import {
  AppRole,
  AuthenticatedUser,
} from '../../../../domain/autenticacao/entities/app-role';
import { Roles } from '../../../../infrastructure/auth/roles.decorator';

type ClienteRequest = { user: AuthenticatedUser };

@ApiTags('Ordem de serviço')
@Controller()
export class OrdemServicoController {
  constructor(
    private readonly criarOs: CriarOrdemServicoUseCase,
    private readonly listarOs: ListarOrdensServicoUseCase,
    private readonly obterOs: ObterOrdemServicoUseCase,
    private readonly consultarStatus: ConsultarStatusOsUseCase,
    private readonly iniciarDiagnostico: IniciarDiagnosticoUseCase,
    private readonly gerarOrcamento: GerarOrcamentoUseCase,
    private readonly aprovarOrcamento: AprovarOrcamentoUseCase,
    private readonly finalizarOs: FinalizarOsUseCase,
    private readonly entregarVeiculo: EntregarVeiculoUseCase,
    private readonly listarHistoricoOs: ListarHistoricoOsUseCase,
    private readonly obterTempoMedio: ObterTempoMedioExecucaoUseCase,
  ) {}

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('ordens-servico')
  @ApiOperation({
    summary: 'Criar OS (público)',
    description: 'Cria uma nova ordem de serviço. Não requer autenticação.',
  })
  @ApiResponse({
    status: 201,
    description: 'OS criada com sucesso (status RECEBIDA)',
  })
  @ApiResponse({
    status: 400,
    description:
      'Dados inválidos (cliente, veículo ou itens inexistentes/inativos)',
  })
  create(@Body() dto: CreateOrdemServicoDto) {
    return this.criarOs.execute(dto);
  }

  @Roles(AppRole.CLIENTE)
  @Get('ordens-servico/:id/status')
  @ApiHeader({
    name: 'x-cpf',
    required: true,
    description: 'CPF do cliente (injetado pelo JWT Authorizer / ADR-007)',
  })
  @ApiHeader({ name: 'x-scope', required: false, description: 'cliente' })
  @ApiOperation({
    summary: 'Consultar status da OS (cliente)',
    description:
      'Exige autenticação de cliente via headers x-cpf / x-scope (API Gateway).',
  })
  @ApiParam({ name: 'id', description: 'UUID da ordem de serviço' })
  @ApiResponse({ status: 200, description: 'Status atual da OS' })
  @ApiResponse({ status: 403, description: 'Sem x-cpf válido' })
  @ApiResponse({
    status: 404,
    description: 'OS não encontrada ou CPF sem acesso',
  })
  getStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: ClienteRequest,
  ) {
    return this.consultarStatus.execute(id, {
      cpfCnpj: requireClienteCpf(req.user),
    });
  }

  @Roles(AppRole.CLIENTE)
  @Post('ordens-servico/:id/aprovacoes')
  @ApiHeader({
    name: 'x-cpf',
    required: true,
    description: 'CPF do cliente (injetado pelo JWT Authorizer / ADR-007)',
  })
  @ApiOperation({
    summary: 'Aprovar ou rejeitar orçamento (cliente)',
    description: 'Cliente autenticado por x-cpf aprova/rejeita o orçamento.',
  })
  @ApiParam({ name: 'id', description: 'UUID da ordem de serviço' })
  @ApiResponse({
    status: 201,
    description:
      'Decisão registrada (status atualizado para EM_EXECUCAO ou REJEITADA)',
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 403, description: 'Sem x-cpf válido' })
  @ApiResponse({ status: 409, description: 'OS não está aguardando aprovação' })
  aprovar(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: ClienteRequest,
    @Body() dto: AprovacaoOrcamentoDto,
  ) {
    return this.aprovarOrcamento.execute(
      id,
      { cpfCnpj: requireClienteCpf(req.user) },
      dto,
    );
  }

  @Get('admin/ordens-servico')
  @ApiBearerAuth('JWT-auth')
  @Roles(AppRole.ADMIN, AppRole.GERENTE, AppRole.MECANICO, AppRole.ATENDENTE)
  @ApiOperation({ summary: 'Listar ordens de serviço (paginado)' })
  @ApiResponse({ status: 200, description: 'Lista paginada de OS' })
  listAdmin(@Query() pagination: PaginationDto) {
    return this.listarOs.execute(pagination);
  }

  @Get('admin/ordens-servico/metricas/tempo-medio')
  @ApiBearerAuth('JWT-auth')
  @Roles(AppRole.ADMIN, AppRole.GERENTE)
  @ApiOperation({
    summary: 'Tempo médio de execução das OS finalizadas',
    description:
      'Retorna o tempo médio (em minutos) entre dataCriacao e dataConclusao das OS em status FINALIZADA/ENTREGUE, agregado global e por serviço.',
  })
  @ApiResponse({ status: 200, description: 'Métricas de tempo médio' })
  metricasTempoMedio() {
    return this.obterTempoMedio.execute();
  }

  @Post('admin/ordens-servico/:id/diagnostico')
  @ApiBearerAuth('JWT-auth')
  @Roles(AppRole.ADMIN, AppRole.GERENTE, AppRole.MECANICO)
  @ApiOperation({
    summary: 'Iniciar diagnóstico (RECEBIDA -> EM_DIAGNOSTICO)',
    description:
      'Marca a OS como em diagnóstico, registrando a transição no histórico.',
  })
  @ApiParam({ name: 'id', description: 'UUID da ordem de serviço' })
  @ApiResponse({ status: 201, description: 'OS em EM_DIAGNOSTICO' })
  @ApiResponse({ status: 404, description: 'OS não encontrada' })
  @ApiResponse({ status: 409, description: 'OS não está em status RECEBIDA' })
  iniciarDiagnosticoAdmin(@Param('id', ParseUUIDPipe) id: string) {
    return this.iniciarDiagnostico.execute(id);
  }

  @Post('admin/ordens-servico/:id/orcamento')
  @ApiBearerAuth('JWT-auth')
  @Roles(AppRole.ADMIN, AppRole.GERENTE, AppRole.MECANICO)
  @ApiOperation({
    summary: 'Gerar ou atualizar orçamento',
    description:
      'Calcula o total da OS e muda o status para AGUARDANDO_APROVACAO.',
  })
  @ApiParam({ name: 'id', description: 'UUID da ordem de serviço' })
  @ApiResponse({
    status: 201,
    description:
      'Orçamento gerado (total calculado, status AGUARDANDO_APROVACAO)',
  })
  @ApiResponse({
    status: 409,
    description: 'OS não está em status válido para gerar orçamento',
  })
  @ApiResponse({ status: 404, description: 'OS não encontrada' })
  gerarOrcamentoAdmin(@Param('id', ParseUUIDPipe) id: string) {
    return this.gerarOrcamento.execute(id);
  }

  @Post('admin/ordens-servico/:id/finalizacao')
  @ApiBearerAuth('JWT-auth')
  @Roles(AppRole.ADMIN, AppRole.GERENTE, AppRole.MECANICO)
  @ApiOperation({ summary: 'Finalizar OS (status -> FINALIZADA)' })
  @ApiParam({ name: 'id', description: 'UUID da ordem de serviço' })
  @ApiResponse({ status: 201, description: 'OS finalizada com sucesso' })
  @ApiResponse({
    status: 409,
    description: 'OS não está em status EM_EXECUCAO',
  })
  finalizarOsAdmin(@Param('id', ParseUUIDPipe) id: string) {
    return this.finalizarOs.execute(id);
  }

  @Post('admin/ordens-servico/:id/entrega')
  @ApiBearerAuth('JWT-auth')
  @Roles(AppRole.ADMIN, AppRole.GERENTE, AppRole.ATENDENTE)
  @ApiOperation({ summary: 'Entregar veículo (status -> ENTREGUE)' })
  @ApiParam({ name: 'id', description: 'UUID da ordem de serviço' })
  @ApiResponse({ status: 201, description: 'Veículo entregue ao cliente' })
  @ApiResponse({ status: 409, description: 'OS não está em status FINALIZADA' })
  entregarVeiculoAdmin(@Param('id', ParseUUIDPipe) id: string) {
    return this.entregarVeiculo.execute(id);
  }

  @Get('admin/ordens-servico/:id')
  @ApiBearerAuth('JWT-auth')
  @Roles(AppRole.ADMIN, AppRole.GERENTE, AppRole.MECANICO, AppRole.ATENDENTE)
  @ApiOperation({
    summary: 'Obter detalhe da OS',
    description:
      'Retorna a OS completa com itens de serviço, peças, cliente e veículo.',
  })
  @ApiParam({ name: 'id', description: 'UUID da ordem de serviço' })
  @ApiResponse({ status: 200, description: 'Dados completos da OS' })
  @ApiResponse({ status: 404, description: 'OS não encontrada' })
  getAdmin(@Param('id', ParseUUIDPipe) id: string) {
    return this.obterOs.execute(id);
  }

  @Get('admin/ordens-servico/:id/historico')
  @ApiBearerAuth('JWT-auth')
  @Roles(AppRole.ADMIN, AppRole.GERENTE, AppRole.MECANICO, AppRole.ATENDENTE)
  @ApiOperation({
    summary: 'Histórico de eventos da OS',
    description:
      'Mudanças de status e notificações armazenados no MongoDB. Retorna array vazio se MONGODB_URI não configurado.',
  })
  @ApiParam({ name: 'id', description: 'UUID da ordem de serviço' })
  @ApiResponse({ status: 200, description: 'Lista de eventos/histórico da OS' })
  getHistorico(@Param('id', ParseUUIDPipe) id: string) {
    return this.listarHistoricoOs.execute(id);
  }
}

function requireClienteCpf(user: AuthenticatedUser): string {
  if (user.role !== AppRole.CLIENTE || !user.cpf) {
    throw new ForbiddenException('Cliente não autenticado');
  }
  return user.cpf;
}
