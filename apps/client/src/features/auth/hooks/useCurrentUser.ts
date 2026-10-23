import { useSession } from '@/features/auth/hooks/useSession';

export function useCurrentUser() {
  return useSession();
}
