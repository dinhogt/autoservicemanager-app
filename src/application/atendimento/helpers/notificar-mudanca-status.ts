import { StatusOs } from '../../../domain/atendimento/value-objects/status-os.enum';
import { statusOsLabel } from '../../../domain/atendimento/value-objects/status-os-label';
import type { OsMongoAuditPort } from '../../../domain/atendimento/ports';
import type { OsStatusNotifierPort } from '../../../domain/atendimento/ports/os-status-notifier.port';

export async function notificarMudancaStatus(params: {
  audit: OsMongoAuditPort;
  notifier: OsStatusNotifierPort;
  ordemServicoId: string;
  clienteNome: string;
  clienteContato: string | null;
  fromStatus: StatusOs;
  toStatus: StatusOs;
  context: string;
}): Promise<void> {
  const { audit, notifier, ordemServicoId, fromStatus, toStatus } = params;
  const mensagem =
    `Status da OS ${ordemServicoId} atualizado: ` +
    `${statusOsLabel(fromStatus)} → ${statusOsLabel(toStatus)}.`;

  await audit.recordNotification({
    ordemServicoId,
    kind: 'OsStatusAlterado',
    message: mensagem,
    channel: 'email',
  });

  await notifier.notificarMudancaStatus({
    ordemServicoId,
    clienteNome: params.clienteNome,
    clienteContato: params.clienteContato,
    statusAnterior: fromStatus,
    statusNovo: toStatus,
  });
}
