/** Nest injection token para envio de orçamento ao cliente. */
export const ORCAMENTO_NOTIFIER = Symbol('ORCAMENTO_NOTIFIER');

export interface OrcamentoNotificacao {
  ordemServicoId: string;
  clienteNome: string;
  clienteContato: string | null;
  total: number;
  /** Link/URL conceitual para aprovação (MVP: identificador da OS). */
  linkAprovacao: string;
}

/**
 * Porta de notificação para o evento "Orçamento enviado para cliente".
 *
 * MVP: a implementação default apenas loga. Pode ser substituída por um
 * adaptador de e-mail/SMS via DI no `AtendimentoModule`.
 */
export interface OrcamentoNotifierPort {
  enviar(notificacao: OrcamentoNotificacao): Promise<void>;
}
