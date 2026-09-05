export class ServicoCatalogo {
  constructor(
    public readonly id: string,
    public readonly descricao: string,
    public readonly precoBase: number,
    public readonly tempoMedioExecucao: number,
    public readonly ativo: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
