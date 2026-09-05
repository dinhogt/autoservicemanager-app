/** Nomes alinhados ao plano (Event Storming / Mongo). */
export const OsDomainEventType = {
  OsCriada: 'OsCriada',
  OsEmDiagnostico: 'OsEmDiagnostico',
  OrcamentoGerado: 'OrcamentoGerado',
  /** Também usado como `kind` em `notification_logs` (intenção / MVP sem canal real). */
  OrcamentoEnviadoParaCliente: 'OrcamentoEnviadoParaCliente',
  OrcamentoAprovado: 'OrcamentoAprovado',
  OrcamentoRejeitado: 'OrcamentoRejeitado',
  PecaReservadaNoEstoque: 'PecaReservadaNoEstoque',
  OsFinalizada: 'OsFinalizada',
  VeiculoEntregue: 'VeiculoEntregue',
} as const;

export type OsDomainEventTypeName =
  (typeof OsDomainEventType)[keyof typeof OsDomainEventType];
