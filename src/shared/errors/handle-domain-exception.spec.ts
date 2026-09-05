import { UnprocessableEntityException } from '@nestjs/common';
import { DomainException } from './domain.exception';
import { handleDomainValidation } from './handle-domain-exception';

describe('handleDomainValidation', () => {
  it('returns value when fn succeeds', () => {
    const result = handleDomainValidation(() => 42);
    expect(result).toBe(42);
  });

  it('converts DomainException to UnprocessableEntityException', () => {
    expect(() =>
      handleDomainValidation(() => {
        throw new DomainException('campo inválido', 'INVALID');
      }),
    ).toThrow(UnprocessableEntityException);
  });

  it('re-throws non-DomainException errors as-is', () => {
    const original = new Error('generic');
    expect(() =>
      handleDomainValidation(() => {
        throw original;
      }),
    ).toThrow(original);
  });

  it('re-throws TypeError as-is', () => {
    expect(() =>
      handleDomainValidation(() => {
        throw new TypeError('oops');
      }),
    ).toThrow(TypeError);
  });
});
