import { tokenStorage } from '@/features/auth/api/tokenStorage';

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8001';

export class ApiError extends Error {
  readonly status: number;
  readonly detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: BodyInit | null;
  headers?: HeadersInit;
  auth?: boolean;
};

async function parseErrorDetail(response: Response): Promise<string> {
  try {
    const data: unknown = await response.json();
    if (
      typeof data === 'object' &&
      data !== null &&
      'detail' in data &&
      typeof data.detail === 'string'
    ) {
      return data.detail;
    }
  } catch {
    // ignore non-JSON bodies
  }
  return response.statusText || 'Une erreur est survenue.';
}

export async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'GET', body = null, headers, auth = true } = options;

  const nextHeaders = new Headers(headers);

  if (auth) {
    const token = tokenStorage.get();
    if (token) {
      nextHeaders.set('Authorization', `Bearer ${token}`);
    }
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: nextHeaders,
    body,
  });

  if (!response.ok) {
    throw new ApiError(response.status, await parseErrorDetail(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function formBody(data: Record<string, string>): URLSearchParams {
  return new URLSearchParams(data);
}
