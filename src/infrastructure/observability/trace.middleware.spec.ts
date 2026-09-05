import { extractRootFromAmznTrace } from './trace.middleware';

describe('extractRootFromAmznTrace', () => {
  it('extrai Root do header AWS', () => {
    expect(
      extractRootFromAmznTrace(
        'Root=1-67891233-abcdef012345678912345678;Parent=53995c3f42cd8ad8;Sampled=1',
      ),
    ).toBe('1-67891233-abcdef012345678912345678');
  });

  it('retorna undefined sem header', () => {
    expect(extractRootFromAmznTrace(undefined)).toBeUndefined();
  });
});
