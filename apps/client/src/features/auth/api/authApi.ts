import { formBody, request } from '@/shared/api/client';
import type {
  LoginCredentials,
  SessionUser,
  TokenResponse,
} from '@/features/auth/types';

type MeResponse = {
  username: string;
};

export async function login(
  credentials: LoginCredentials
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

export async function getMe(): Promise<SessionUser> {
  const me = await request<MeResponse>('/me');
  return { id: me.username };
}

export const authQueryKeys = {
  all: ['auth'] as const,
  session: ['auth', 'session'] as const,
};
