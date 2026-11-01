import { useQuery } from '@tanstack/react-query';
import { fetchWeekly, timeQueryKeys } from '../api/dashboardApi';

export function useWeekly(id: string | undefined) {
  return useQuery({
    queryKey: timeQueryKeys.weekly(id ?? ''),
    queryFn: () => fetchWeekly(id!),
    enabled: Boolean(id),
  });
}
