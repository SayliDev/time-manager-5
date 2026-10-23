import type { User } from '@/features/users/types';

/** Assemble le prénom et le nom pour les libellés du front. */
export const fullName = (user: Pick<User, 'firstName' | 'lastName'>) => `${user.firstName} ${user.lastName}`;
/** Construit les initiales de l’avatar en tolérant un prénom ou un nom vide. */
export const initials = (user: Pick<User, 'firstName' | 'lastName'>) => `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`;
