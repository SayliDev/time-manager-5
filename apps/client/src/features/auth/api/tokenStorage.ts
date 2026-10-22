const ACCESS_TOKEN_KEY = 'access_token';

export const tokenStorage = {
  get(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  set(token: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  },

  clear(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  },
};
