import { normalizeCodigoInterno } from './codigo-interno.util';

describe('codigo-interno.util', () => {
  it('trim e maiúsculas', () => {
    expect(normalizeCodigoInterno('  ab-cd  ')).toBe('AB-CD');
  });
});
