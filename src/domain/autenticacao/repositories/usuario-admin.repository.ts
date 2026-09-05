import { RoleAdmin, UsuarioAdmin } from '../entities/usuario-admin.entity';

export const USUARIO_ADMIN_REPOSITORY = Symbol('USUARIO_ADMIN_REPOSITORY');

export interface UsuarioAdminRepository {
  create(data: {
    nome: string;
    email: string;
    senhaHash: string;
    role: RoleAdmin;
  }): Promise<UsuarioAdmin>;

  update(
    id: string,
    data: Partial<{
      nome: string;
      email: string;
      senhaHash: string;
      role: RoleAdmin;
      ativo: boolean;
    }>,
  ): Promise<UsuarioAdmin>;

  findById(id: string): Promise<UsuarioAdmin | null>;

  findByEmail(email: string): Promise<UsuarioAdmin | null>;

  findAll(pagination?: { skip: number; take: number }): Promise<UsuarioAdmin[]>;

  count(): Promise<number>;
}
