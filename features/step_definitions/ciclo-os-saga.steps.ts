import {
  Before,
  Given,
  Then,
  When,
  setDefaultTimeout,
} from '@cucumber/cucumber';
import { strict as assert } from 'node:assert';
import { randomUUID } from 'node:crypto';

setDefaultTimeout(60_000);

const osUrl = process.env.OS_URL ?? 'http://localhost:3000';
const billingUrl = process.env.BILLING_URL ?? 'http://localhost:3001';
const executionUrl = process.env.EXECUTION_URL ?? 'http://localhost:3002';
const secret = process.env.SAGA_EVENTS_SECRET ?? 'phase4-local-secret';

let orderId = '';
let correlationId = '';
let duplicateMessageId = '';

Before(() => {
  orderId = '';
  correlationId = '';
  duplicateMessageId = '';
});

Given(
  'que os serviços OS, Billing e Execution estão disponíveis',
  async () => {
    for (const healthUrl of [
      `${osUrl}/health`,
      `${billingUrl}/health/live`,
      `${executionUrl}/health`,
    ]) {
      await waitForHealth(healthUrl);
    }
  },
);

Given('que a mensageria está vazia', () => {
  // A pilha é recriada pelo compose para cada execução do perfil BDD.
});

Given('que o Mercado Pago sandbox está configurado', async () => {
  await waitForHealth(
    `${process.env.MP_URL ?? 'http://localhost:3003'}/health`,
  );
});

When(
  'uma saga for iniciada para a ordem {string}',
  async (requestedOrderId: string) => {
    orderId = requestedOrderId;
    const metadata: Record<string, unknown> = {
      amount: 100,
      customerEmail: 'bdd@autoservice.local',
      description: `BDD ${orderId}`,
    };
    if (orderId.endsWith('002')) {
      metadata.diagnosisForceFailure = true;
      metadata.diagnosisFailureReason = 'scanner offline';
    }
    if (orderId.endsWith('005')) {
      metadata.executionForceFailure = true;
      metadata.executionFailureReason = 'falha mecânica';
    }
    const response = await sagaRequest('', {
      method: 'POST',
      body: JSON.stringify({ ordemServicoId: orderId, metadata }),
    });
    await assertOk(response);
    correlationId = String((await response.json()).correlationId);
  },
);

When(
  'o evento {string} ocorrer com pagamento aprovado',
  async (eventType: string) => {
    await inject(eventType, { amount: 100 });
    await waitForStatus('AWAITING_PAYMENT');
    const billing = await waitForBilling();
    const response = await fetch(`${billingUrl}/billing/webhooks/mercado-pago`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-request-id': randomUUID(),
      },
      body: JSON.stringify({ data: { id: billing.paymentId } }),
    });
    await assertOk(response);
  },
);

When('o evento {string} for injetado', async (eventType: string) => {
  const status = await currentStatus();
  if (
    eventType === 'diagnosis.completed' &&
    status !== 'AWAITING_DIAGNOSIS'
  ) {
    return;
  }
  await inject(eventType, payloadFor(eventType));
});

When(
  'o mesmo evento {string} for injetado duas vezes',
  async (eventType: string) => {
    duplicateMessageId = randomUUID();
    await inject(eventType, payloadFor(eventType), duplicateMessageId);
    await inject(eventType, payloadFor(eventType), duplicateMessageId);
  },
);

Then('a saga deve alcançar {string}', async (status: string) => {
  await waitForStatus(status);
});

async function inject(
  messageType: string,
  payload: Record<string, unknown>,
  messageId: string = randomUUID(),
): Promise<void> {
  const response = await sagaRequest('/events', {
    method: 'POST',
    body: JSON.stringify({
      schemaVersion: '1.0',
      messageId,
      messageType,
      occurredAt: new Date().toISOString(),
      correlationId,
      aggregateId: orderId,
      source: 'phase4-bdd',
      payload,
    }),
  });
  await assertOk(response);
}

async function currentStatus(): Promise<string> {
  const response = await sagaRequest(`/${correlationId}`);
  await assertOk(response);
  return String((await response.json()).status);
}

async function waitForStatus(expected: string): Promise<void> {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if ((await currentStatus()) === expected) return;
    await delay(250);
  }
  assert.fail(`Saga ${correlationId} did not reach ${expected}`);
}

async function waitForBilling(): Promise<{ paymentId: string }> {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    const response = await fetch(`${billingUrl}/billing/${orderId}`);
    if (response.ok) {
      const billing = (await response.json()) as { paymentId?: string };
      if (billing.paymentId) return { paymentId: billing.paymentId };
    }
    await delay(250);
  }
  throw new Error(`Billing for ${orderId} was not created`);
}

function sagaRequest(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${osUrl}/internal/sagas${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      'x-saga-secret': secret,
      ...(init?.headers ?? {}),
    },
  });
}

function payloadFor(eventType: string): Record<string, unknown> {
  if (eventType === 'budget.approved') return { amount: 100 };
  if (eventType === 'payment.authorized') return { paymentId: 'payment-bdd' };
  if (eventType.endsWith('.failed')) return { reason: 'falha BDD' };
  return {};
}

async function assertOk(response: Response): Promise<void> {
  if (!response.ok) {
    assert.fail(
      `HTTP ${response.status} ${response.statusText}: ${await response.text()}`,
    );
  }
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function waitForHealth(url: string): Promise<void> {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      // Container is still starting.
    }
    await delay(250);
  }
  assert.fail(`${url} is unavailable`);
}
