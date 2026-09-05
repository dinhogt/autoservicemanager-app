export class PecaEstoque {
  constructor(
    public readonly id: string,
    public readonly descricao: string,
    public readonly precoUnitario: number,
    public readonly quantidadeEmEstoque: number,
    public readonly codigoInterno: string,
    public readonly ativo: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
