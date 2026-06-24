import type { User } from './api';

export function isProfessional(user: Pick<User, 'role'> | null | undefined): boolean {
  return user?.role === 'professional';
}
