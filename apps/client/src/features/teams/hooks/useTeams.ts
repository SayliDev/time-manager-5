import { useQuery } from '@tanstack/react-query';
import { fetchTeams } from '@/shared/api/client';

/** Met en cache les équipes autorisées et les actualise toutes les 60 secondes. */
export function useTeams() {
  return useQuery({
    queryKey: ['teams'],
    queryFn: ({ signal }) => fetchTeams(signal),
    refetchInterval: 60_000,
  });
}
