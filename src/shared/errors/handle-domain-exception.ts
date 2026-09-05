import { UnprocessableEntityException } from '@nestjs/common';
import { DomainException } from './domain.exception';

/**
 * Executes a factory function and converts DomainException into
 * UnprocessableEntityException (HTTP 422). Re-throws other errors as-is.
 */
export function handleDomainValidation<T>(fn: () => T): T {
  try {
    return fn();
  } catch (e) {
    if (e instanceof DomainException) {
      throw new UnprocessableEntityException(e.message);
    }
    throw e;
  }
}
