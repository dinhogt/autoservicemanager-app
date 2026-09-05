import { DomainException } from '../../../shared/errors/domain.exception';

export class StatusTransitionException extends DomainException {
  constructor(message: string) {
    super(message, 'STATUS_TRANSITION');
    this.name = 'StatusTransitionException';
  }
}
