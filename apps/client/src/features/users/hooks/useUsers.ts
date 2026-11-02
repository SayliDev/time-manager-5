import { useQuery } from '@tanstack/react-query';
import {
  fetchUser,
  fetchUsers,
  usersQueryKeys,
} from '@/features/users/api/usersApi';
import type { User } from '@/features/users/types';

const selectActiveUsers = (users: User[]) =>
  users.filter((user) => user.deactivatedAt === null);

export function useUsers() {
  return useQuery({
    queryKey: usersQueryKeys.list(),
    queryFn: fetchUsers,
    select: selectActiveUsers,
  });
}

export function useUser(id: string | undefined) {
  return useQuery({
    queryKey: usersQueryKeys.detail(id ?? ''),
    queryFn: () => fetchUser(id!),
    enabled: Boolean(id),
  });
}
