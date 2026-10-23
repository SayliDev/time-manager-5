import { useQuery } from '@tanstack/react-query';
import { authQueryKeys, getMe } from '@/shared/api/client';
import { tokenStorage } from '@/features/auth/api/tokenStorage';

export function useSession() {
  const token = tokenStorage.get();

  return useQuery({
    queryKey: authQueryKeys.session,
    queryFn: getMe,
    enabled: Boolean(token),
    retry: false,
  });
}
