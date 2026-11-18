import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import type { WorkMode } from '@/features/time/types';
import { clockIn, clockOut, timeQueryKeys } from '../api/dashboardApi';

export function useClockIn() {
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();

  return useMutation({
    mutationFn: (mode: WorkMode) => clockIn(mode),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: timeQueryKeys.user(currentUser?.id ?? ''),
      }),
  });
}

export function useClockOut() {
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();

  return useMutation({
    mutationFn: () => clockOut(),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: timeQueryKeys.user(currentUser?.id ?? ''),
      }),
  });
}
