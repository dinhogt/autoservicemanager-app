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

  it('aceita MONGODB_URI vazio ou undefined', () => {
    const { error: e1 } = envValidationSchema.validate(
      { ...baseEnv, MONGODB_URI: '' },
      { allowUnknown: true },
    );
    expect(e1).toBeUndefined();
  });

  it('aceita MONGODB_URI mongodb+srv', () => {
    const { error } = envValidationSchema.validate(
      { ...baseEnv, MONGODB_URI: 'mongodb+srv://h/db' },
      { allowUnknown: true },
    );
    expect(error).toBeUndefined();
  });

  it('rejeita MONGODB_URI com scheme inválido', () => {
    const { error } = envValidationSchema.validate(
      { ...baseEnv, MONGODB_URI: 'http://example.com' },
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

  it('aceita MONGODB_URI mongodb:// padrão', () => {
    const { error } = envValidationSchema.validate(
      { ...baseEnv, MONGODB_URI: 'mongodb://localhost:27017/db' },
      { allowUnknown: true },
    );
    expect(error).toBeUndefined();
  });

  it('aceita MONGODB_URI undefined (não fornecido)', () => {
    const { error } = envValidationSchema.validate(baseEnv, {
      allowUnknown: true,
    });
    expect(error).toBeUndefined();
  });
});
