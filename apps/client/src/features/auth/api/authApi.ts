import { formBody, request } from '@/shared/api/client';
import type { LoginCredentials, TokenResponse } from '@/features/auth/types';
import { toUser, type UserDto } from '@/features/users/api/usersApi';
import type { User } from '@/features/users/types';

export async function login(
  credentials: LoginCredentials,
): Promise<TokenResponse> {
  return request<TokenResponse>('/api/auth/login', {
    method: 'POST',
    auth: false,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formBody({
      username: credentials.email,
      password: credentials.password,
    }),
  });
}

export async function getMe(): Promise<User> {
  return toUser(await request<UserDto>('/me'));
}

export const authQueryKeys = {
  all: ['auth'] as const,
  session: ['auth', 'session'] as const,
};

export function requestPasswordReset(): Promise<{ message: string }> {
  return request('/api/me/password-reset', { method: 'POST' });
}

export function resetPassword(payload: { token: string; password: string }): Promise<{ message: string }> {
  return request('/api/auth/reset-password', {
    method: 'POST',
    auth: false,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export interface ManagerIdentity {
  id_user: number;
  first_name: string;
  last_name: string;
  email: string;
}

export function getMyManagers(): Promise<ManagerIdentity[]> {
  return request('/api/me/managers');
}
