import { envValidationSchema } from './env.validation';

describe('envValidationSchema', () => {
  const baseEnv = {
    DATABASE_URL: 'mysql://user:pass@localhost:3306/db',
    JWT_SECRET: 'a'.repeat(32),
  };

  it('aceita env válido com defaults', () => {
    const { error, value } = envValidationSchema.validate(baseEnv, {
      allowUnknown: true,
    });
    expect(error).toBeUndefined();
    expect(value.NODE_ENV).toBe('development');
    expect(value.PORT).toBe(3000);
  });

  it('rejeita JWT_SECRET curto', () => {
    const { error } = envValidationSchema.validate(
      { ...baseEnv, JWT_SECRET: 'short' },
      { allowUnknown: true },
    );
    expect(error).toBeDefined();
  });

  it('rejeita NODE_ENV inválido', () => {
    const { error } = envValidationSchema.validate(
      { ...baseEnv, NODE_ENV: 'staging' },
      { allowUnknown: true },
    );
    expect(error).toBeDefined();
  });

  it('rejeita DATABASE_URL ausente', () => {
    const { error } = envValidationSchema.validate(
      { JWT_SECRET: 'a'.repeat(32) },
      { allowUnknown: true },
    );
    expect(error).toBeDefined();
    expect(error!.message).toContain('DATABASE_URL');
  });

  it('rejeita JWT_SECRET ausente', () => {
    const { error } = envValidationSchema.validate(
      { DATABASE_URL: 'mysql://user:pass@localhost:3306/db' },
      { allowUnknown: true },
    );
    expect(error).toBeDefined();
  });

  it('aceita PORT numérico customizado', () => {
    const { error, value } = envValidationSchema.validate(
      { ...baseEnv, PORT: 8080 },
      { allowUnknown: true },
    );
    expect(error).toBeUndefined();
    expect(value.PORT).toBe(8080);
  });

  it('aceita METRICS_ENVIRONMENT opcional', () => {
    const { error, value } = envValidationSchema.validate(
      { ...baseEnv, METRICS_ENVIRONMENT: 'homolog' },
      { allowUnknown: true },
    );
    expect(error).toBeUndefined();
    expect(value.METRICS_ENVIRONMENT).toBe('homolog');
  });
});
