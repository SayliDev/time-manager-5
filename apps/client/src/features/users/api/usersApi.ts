import { request } from '@/shared/api/client';
import type { CreateUserInput, Role, User } from '@/features/users/types';

/* ------------------------------------------------------------------ */
/*  Contrat de l'API (apps/api/app/routers/users_routers.py)           */
/* ------------------------------------------------------------------ */

type ApiRole = 'admin' | 'manager' | 'employe';

export interface UserDto {
  id_user: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string | null;
  phone: string | null;
  creat_at: string | null;
  desactive_at: string | null;
}

interface CreateUserDto {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role: ApiRole;
  phone: string | null;
}

/* ------------------------------------------------------------------ */
/*  Mapping API ⇄ domaine                                              */
/* ------------------------------------------------------------------ */

function toRole(role: string | null): Role {
  if (role === 'admin' || role === 'manager') return role;
  return 'employee';
}

function toApiRole(role: Role): ApiRole {
  return role === 'employee' ? 'employe' : role;
}

export function toUser(dto: UserDto): User {
  return {
    id: String(dto.id_user),
    firstName: dto.first_name,
    lastName: dto.last_name,
    email: dto.email,
    phone: dto.phone,
    role: toRole(dto.role),
    createdAt: dto.creat_at,
    deactivatedAt: dto.desactive_at,
    teamId: null,
    presence: null,
    weeklyHours: null,
    lastClock: null,
  };
}

function toCreateUserDto(input: CreateUserInput): CreateUserDto {
  return {
    first_name: input.firstName,
    last_name: input.lastName,
    email: input.email,
    password: input.password,
    role: toApiRole(input.role),
    phone: input.phone,
  };
}

/* ------------------------------------------------------------------ */
/*  Requêtes                                                           */
/* ------------------------------------------------------------------ */

export const usersQueryKeys = {
  all: ['users'] as const,
  list: () => [...usersQueryKeys.all, 'list'] as const,
  detail: (id: string) => [...usersQueryKeys.all, 'detail', id] as const,
};

export async function fetchUsers(): Promise<User[]> {
  const users = await request<UserDto[]>('/api/getAllUsers');
  return users.map(toUser);
}

export async function fetchUser(id: string): Promise<User> {
  const user = await request<UserDto>(
    `/api/getUsers/${encodeURIComponent(id)}`,
  );
  return toUser(user);
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const user = await request<UserDto>('/api/addUsers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toCreateUserDto(input)),
  });
  return toUser(user);
}

export async function deactivateUser(id: string): Promise<void> {
  await request<void>(`/api/deactivateUser/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}
