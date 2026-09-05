import { ConflictException } from '@nestjs/common';

/** Conflito de transição de status de OS — mapeado para HTTP 409 na borda HTTP. */
export class OrderStatusConflictException extends ConflictException {
  constructor(message: string) {
    super(message);
  }
}
