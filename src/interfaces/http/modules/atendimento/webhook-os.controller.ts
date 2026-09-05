import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ProcessarWebhookStatusOsUseCase } from '../../../../application/atendimento/use-cases/processar-webhook-status-os.use-case';
import { WebhookStatusOsDto } from '../../../../application/atendimento/dto/webhook-status-os.dto';
import { Public } from '../../../../infrastructure/auth/public.decorator';
import { WebhookSecretGuard } from '../../../../infrastructure/auth/webhook-secret.guard';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhookOsController {
  constructor(
    private readonly processarWebhook: ProcessarWebhookStatusOsUseCase,
  ) {}

  @Public()
  @UseGuards(WebhookSecretGuard)
  @Post('os/:id/status')
  @ApiOperation({
    summary: 'Atualizar status da OS via integração externa',
    description:
      'Endpoint para ferramentas externas (e-mail, automação). Requer header X-Webhook-Secret.',
  })
  @ApiHeader({
    name: 'X-Webhook-Secret',
    description: 'Secret compartilhado (WEBHOOK_SECRET)',
    required: true,
  })
  @ApiParam({ name: 'id', description: 'UUID da ordem de serviço' })
  @ApiResponse({ status: 201, description: 'Status atualizado' })
  @ApiResponse({ status: 401, description: 'Secret inválido ou ausente' })
  @ApiResponse({ status: 409, description: 'Transição de status inválida' })
  atualizarStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: WebhookStatusOsDto,
  ) {
    return this.processarWebhook.execute(id, dto);
  }
}
