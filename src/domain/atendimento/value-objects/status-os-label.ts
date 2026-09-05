import { StatusOs } from './status-os.enum';

const STATUS_LABEL: Record<StatusOs, string> = {
  [StatusOs.RECEBIDA]: 'Recebida',
  [StatusOs.EM_DIAGNOSTICO]: 'Em diagnóstico',
  [StatusOs.AGUARDANDO_APROVACAO]: 'Aguardando aprovação',
  [StatusOs.EM_EXECUCAO]: 'Em execução',
  [StatusOs.FINALIZADA]: 'Finalizada',
  [StatusOs.ENTREGUE]: 'Entregue',
  [StatusOs.REJEITADA]: 'Rejeitada',
};

export function statusOsLabel(status: StatusOs): string {
  return STATUS_LABEL[status];
}
