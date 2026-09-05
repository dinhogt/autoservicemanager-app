import { StatusOs } from '../value-objects/status-os.enum';

export const OS_STATUS_NOTIFIER = Symbol('OS_STATUS_NOTIFIER');

export interface OsStatusNotificacao {
  ordemServicoId: string;
  clienteNome: string;
  clienteContato: string | null;
  statusAnterior: StatusOs;
  statusNovo: StatusOs;
}

export interface OsStatusNotifierPort {
  notificarMudancaStatus(notificacao: OsStatusNotificacao): Promise<void>;
}
