import { useQuery } from '@tanstack/react-query';
import { authQueryKeys, getMe } from '@/features/auth/api/authApi';

export function useSession() {
  return useQuery({
    queryKey: authQueryKeys.session,
    queryFn: getMe,
    enabled: true,
    retry: false,
  });
}
