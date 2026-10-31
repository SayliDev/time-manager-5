import { useQuery } from '@tanstack/react-query';
import { fetchDailyHours } from '../api/dashboardApi';

export function useDaily(id: string | undefined, from: string, to: string) {
  return useQuery({
    queryKey: ['daily', id, from, to],
    queryFn: () => fetchDailyHours(id!, from, to),
    enabled: Boolean(id),
  });
}
