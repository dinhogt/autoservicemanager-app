import { TotalOs } from './total-os.vo';

describe('TotalOs', () => {
  describe('zero', () => {
    it('creates instance with value 0', () => {
      const total = TotalOs.zero();
      expect(total.value).toBe(0);
    });
  });

  describe('from', () => {
    it('wraps a numeric value', () => {
      const total = TotalOs.from(123.45);
      expect(total.value).toBe(123.45);
    });

    it('wraps zero', () => {
      expect(TotalOs.from(0).value).toBe(0);
    });
  });

  describe('add', () => {
    it('adds amount and returns new instance', () => {
      const total = TotalOs.zero().add(100);
      expect(total.value).toBe(100);
    });

    it('chains additions correctly', () => {
      const total = TotalOs.zero().add(10.1).add(20.2);
      expect(total.value).toBe(30.3);
    });

    it('rounds to 2 decimal places to avoid floating point errors', () => {
      const total = TotalOs.zero().add(0.1).add(0.2);
      expect(total.value).toBe(0.3);
    });

    it('handles large values', () => {
      const total = TotalOs.from(99999.99).add(0.01);
      expect(total.value).toBe(100000);
    });

    it('returns a new instance (immutability)', () => {
      const a = TotalOs.from(10);
      const b = a.add(5);
      expect(a.value).toBe(10);
      expect(b.value).toBe(15);
      expect(a).not.toBe(b);
    });
  });
});
