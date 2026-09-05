import { ORDEM_SERVICO_REPOSITORY } from './ordem-servico.repository';

describe('OrdemServicoRepository', () => {
  it('exports ORDEM_SERVICO_REPOSITORY as a Symbol', () => {
    expect(typeof ORDEM_SERVICO_REPOSITORY).toBe('symbol');
    expect(ORDEM_SERVICO_REPOSITORY.toString()).toContain(
      'ORDEM_SERVICO_REPOSITORY',
    );
  });
});
