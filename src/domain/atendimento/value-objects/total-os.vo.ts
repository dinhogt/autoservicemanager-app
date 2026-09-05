/**
 * Value Object representing the total monetary value of an OrdemServico.
 * Wraps arithmetic to avoid scattered floating-point rounding in use cases.
 */
export class TotalOs {
  private constructor(public readonly value: number) {}

  static zero(): TotalOs {
    return new TotalOs(0);
  }

  static from(value: number): TotalOs {
    return new TotalOs(value);
  }

  add(amount: number): TotalOs {
    return new TotalOs(Math.round((this.value + amount) * 100) / 100);
  }
}
