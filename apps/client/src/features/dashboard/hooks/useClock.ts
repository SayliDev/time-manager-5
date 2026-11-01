import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import {
  clockIn,
  clockOut,
  timeQueryKeys,
  type WorkMode,
} from '../api/dashboardApi';

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
