import { useQuery } from '@tanstack/react-query';
import { fetchUsers } from '@/shared/api/client';

/** Partage l’annuaire autorisé entre les listes et la recherche, avec actualisation régulière. */
export function useUsers() {
  return useQuery({ queryKey: ['users'], queryFn: ({ signal }) => fetchUsers(signal), refetchInterval: 60_000 });
}
