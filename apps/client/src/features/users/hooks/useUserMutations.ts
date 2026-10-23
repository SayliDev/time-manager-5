import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createUser,
  deactivateUser,
  usersQueryKeys,
} from '@/features/users/api/usersApi';
import type { CreateUserInput } from '@/features/users/types';

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateUserInput) => createUser(input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: usersQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ]);
    },
  });
}

export function useDeactivateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deactivateUser(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: usersQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ]);
    },
  });
}
