import { useQuery } from '@tanstack/react-query';
import { fetchProfile } from '@/shared/api/client';

/** Partage le profil connecté en cache entre la navigation et le dashboard. */
export function useProfile() {
  return useQuery({
    queryKey: ['session-profile'],
    queryFn: ({ signal }) => fetchProfile(signal),
  });
}
