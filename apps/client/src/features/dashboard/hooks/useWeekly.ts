import { useQuery } from '@tanstack/react-query';
import { fetchWeekly, timeQueryKeys } from '../api/dashboardApi';

export function useWeekly(id: string | undefined, from: string, to: string) {
  return useQuery({
    queryKey: timeQueryKeys.weekly(id ?? '', from, to),
    queryFn: () => fetchWeekly(id!, from, to),
    enabled: Boolean(id),
  });
}
