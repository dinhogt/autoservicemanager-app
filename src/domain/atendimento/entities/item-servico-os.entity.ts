export class ItemServicoOs {
  constructor(
    public readonly id: string,
    public readonly ordemServicoId: string,
    public readonly servicoCatalogoId: string,
    public readonly quantidade: number,
    public readonly precoAplicado: number,
  ) {}
}
