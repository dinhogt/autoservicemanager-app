import { SetMetadata } from '@nestjs/common';
import { AppRole } from '../../domain/autenticacao/entities/app-role';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: AppRole[]): ReturnType<typeof SetMetadata> =>
  SetMetadata(ROLES_KEY, roles);
