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
