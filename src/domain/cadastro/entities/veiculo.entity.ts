export class Veiculo {
  constructor(
    public readonly id: string,
    public readonly clienteId: string,
    /** Placa normalizada */
    public readonly placa: string,
    public readonly marca: string | null,
    public readonly modelo: string | null,
    public readonly ano: number | null,
    public readonly ativo: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
