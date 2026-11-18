import { useQuery } from '@tanstack/react-query';
import { useSession } from '@/features/auth/hooks/useSession';
import { fetchUser, usersQueryKeys } from '@/features/users/api/usersApi';

export function useCurrentUser() {
  const session = useSession();
  const id = session.data?.id ?? '';

  return useQuery({
    queryKey: usersQueryKeys.detail(id),
    queryFn: () => fetchUser(id),
    enabled: Boolean(id),
    retry: false,
  });
}
