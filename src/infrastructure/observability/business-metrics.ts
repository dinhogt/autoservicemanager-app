/**
 * CloudWatch Embedded Metric Format (EMF) + eventos JSON para Logs Insights.
 * Fluent Bit / CloudWatch agent extrai métricas automaticamente do campo `_aws`.
 */

export type OsFaseLabel = 'Diagnostico' | 'Execucao' | 'Finalizacao';

const FASE_BY_STATUS: Record<string, OsFaseLabel> = {
  EM_DIAGNOSTICO: 'Diagnostico',
  EM_EXECUCAO: 'Execucao',
  FINALIZADA: 'Finalizacao',
};

export function faseLabelFromStatus(status: string | null | undefined): OsFaseLabel | null {
  if (!status) return null;
  return FASE_BY_STATUS[status] ?? null;
}

function metricsNamespace(): string {
  const env =
    process.env.METRICS_ENVIRONMENT ||
    process.env.APP_ENVIRONMENT ||
    process.env.NODE_ENV ||
    'development';
  return `AutoServiceManager/${env}`;
}

function emitEmfLine(payload: Record<string, unknown>): void {
  process.stdout.write(`${JSON.stringify(payload)}\n`);
}

/** Contagem de OS criada (dashboard volume diário). */
export function emitOsCriadaMetric(ordemServicoId: string): void {
  const ns = metricsNamespace();
  const now = Date.now();
  emitEmfLine({
    _aws: {
      Timestamp: now,
      CloudWatchMetrics: [
        {
          Namespace: ns,
          Dimensions: [],
          Metrics: [{ Name: 'OsCriada', Unit: 'Count' }],
        },
      ],
    },
    OsCriada: 1,
    event: 'os_criada',
    ordemServicoId,
    message: `OS criada ${ordemServicoId}`,
    timestamp: new Date(now).toISOString(),
  });
}

/** Duração em ms da fase que está sendo encerrada (fromStatus). */
export function emitOsFaseDuracaoMetric(input: {
  ordemServicoId: string;
  fromStatus: string;
  toStatus: string;
  durationMs: number;
}): void {
  const fase = faseLabelFromStatus(input.fromStatus);
  if (!fase) return;

  const ns = metricsNamespace();
  const now = Date.now();
  emitEmfLine({
    _aws: {
      Timestamp: now,
      CloudWatchMetrics: [
        {
          Namespace: ns,
          Dimensions: [['Fase']],
          Metrics: [{ Name: 'OsFaseDuracao', Unit: 'Milliseconds' }],
        },
      ],
    },
    Fase: fase,
    OsFaseDuracao: Math.max(0, Math.round(input.durationMs)),
    event: 'os_fase_duracao',
    ordemServicoId: input.ordemServicoId,
    fromStatus: input.fromStatus,
    toStatus: input.toStatus,
    message: `Fase ${fase} encerrada em ${Math.round(input.durationMs)}ms`,
    timestamp: new Date(now).toISOString(),
  });
}
