import { ConflictException } from '@nestjs/common';
import { StatusTransitionException } from '../../../domain/atendimento/errors/status-transition.exception';
import { runOrderStatusAssertion } from './run-order-status-assertion';

describe('runOrderStatusAssertion', () => {
  it('mapeia StatusTransitionException para ConflictException', () => {
    expect(() =>
      runOrderStatusAssertion(() => {
        throw new StatusTransitionException('status inválido');
      }),
    ).toThrow(ConflictException);
  });

  it('repropaga erros não relacionados a transição', () => {
    expect(() =>
      runOrderStatusAssertion(() => {
        throw new Error('boom');
      }),
    ).toThrow('boom');
  });
});
