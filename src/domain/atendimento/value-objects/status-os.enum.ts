/** Status da ordem de serviço (domínio — espelha valores persistidos no MySQL/Prisma). */
export enum StatusOs {
  RECEBIDA = 'RECEBIDA',
  EM_DIAGNOSTICO = 'EM_DIAGNOSTICO',
  AGUARDANDO_APROVACAO = 'AGUARDANDO_APROVACAO',
  EM_EXECUCAO = 'EM_EXECUCAO',
  FINALIZADA = 'FINALIZADA',
  ENTREGUE = 'ENTREGUE',
  REJEITADA = 'REJEITADA',
}

/** OS ainda em fluxo operacional (não entregue nem rejeitada). */
export const STATUS_OS_NAO_TERMINAIS: StatusOs[] = [
  StatusOs.RECEBIDA,
  StatusOs.EM_DIAGNOSTICO,
  StatusOs.AGUARDANDO_APROVACAO,
  StatusOs.EM_EXECUCAO,
  StatusOs.FINALIZADA,
];

export const STATUS_OS_TERMINAIS_PARA_METRICAS: StatusOs[] = [
  StatusOs.FINALIZADA,
  StatusOs.ENTREGUE,
];
