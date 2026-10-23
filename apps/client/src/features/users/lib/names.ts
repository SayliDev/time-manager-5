import type { Role, User } from '@/features/users/types';

type Named = Pick<User, 'firstName' | 'lastName'>;

export const fullName = (u: Named) => `${u.firstName} ${u.lastName}`;

export const initials = (u: Named) =>
  `${u.firstName[0] ?? ''}${u.lastName[0] ?? ''}`.toUpperCase();

/** Les managers et les administrateurs ont accès aux écrans de gestion. */
export const isManagerRole = (role: Role) =>
  role === 'manager' || role === 'admin';

export const roleLabels: Record<Role, string> = {
  admin: 'Administrateur',
  manager: 'Manager',
  employee: 'Employé',
};
