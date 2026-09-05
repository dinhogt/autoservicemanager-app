export class ItemPecaOs {
  constructor(
    public readonly id: string,
    public readonly ordemServicoId: string,
    public readonly pecaEstoqueId: string,
    public readonly quantidade: number,
    public readonly precoUnitario: number,
    public readonly reservado: boolean,
    public readonly baixado: boolean,
  ) {}
}
