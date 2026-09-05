export enum RoleAdmin {
  ADMIN = 'ADMIN',
  GERENTE = 'GERENTE',
  MECANICO = 'MECANICO',
  ATENDENTE = 'ATENDENTE',
}

export class UsuarioAdmin {
  constructor(
    public readonly id: string,
    public readonly nome: string,
    public readonly email: string,
    public readonly senhaHash: string,
    public readonly role: RoleAdmin,
    public readonly ativo: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
