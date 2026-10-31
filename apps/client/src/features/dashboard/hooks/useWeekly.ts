import { useQuery } from '@tanstack/react-query';
import { fetchWeekly } from '../api/dashboardApi';

export function useWeekly(id: string | undefined) {
  return useQuery({
    queryKey: ['weekly', id],
    queryFn: () => fetchWeekly(id!),
    enabled: Boolean(id),
  });
}
