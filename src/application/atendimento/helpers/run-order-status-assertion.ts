import { StatusTransitionException } from '../../../domain/atendimento/errors/status-transition.exception';
import { OrderStatusConflictException } from '../errors/order-status-conflict.exception';

/** Executa asserções de domínio e mapeia conflito de status para HTTP 409. */
export function runOrderStatusAssertion(fn: () => void): void {
  try {
    fn();
  } catch (e) {
    if (e instanceof StatusTransitionException) {
      throw new OrderStatusConflictException(e.message);
    }
    throw e;
  }
}
