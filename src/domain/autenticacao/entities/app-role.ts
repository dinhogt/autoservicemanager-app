import { RoleAdmin } from './usuario-admin.entity';

/** Roles do app: staff (HS256) + cliente (headers do API Gateway / ADR-007). */
export enum AppRole {
  ADMIN = 'ADMIN',
  GERENTE = 'GERENTE',
  MECANICO = 'MECANICO',
  ATENDENTE = 'ATENDENTE',
  CLIENTE = 'CLIENTE',
}

export type AuthenticatedUser =
  | { role: RoleAdmin; userId: string; email: string; cpf?: undefined }
  | { role: AppRole.CLIENTE; userId: string; cpf: string; email?: undefined };
