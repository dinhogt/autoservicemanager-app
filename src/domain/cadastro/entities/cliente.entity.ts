export class Cliente {
  constructor(
    public readonly id: string,
    public readonly nome: string,
    /** CPF ou CNPJ somente dígitos */
    public readonly cpfCnpj: string,
    public readonly contato: string | null,
    public readonly enderecos: string | null,
    public readonly ativo: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
