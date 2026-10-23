import { useQuery } from '@tanstack/react-query';
import { fetchTimekeeping, fetchTimeEntries, fetchDailyHours, fetchTimeSummary, type TimeRange } from '@/shared/api/client';
import { useUsers } from '@/features/users/hooks/useUsers';
import { currentDateRange, currentWeekRange } from '@/shared/lib/format';

/** Sélectionne l’employé demandé ou le premier accessible, puis charge sa période.
 * La clé de cache inclut compte et dates pour séparer les historiques. */
export function useTimekeeping(userId: string, startDate?: string, endDate?: string) {
  const directory = useUsers();
  const selectedId = userId || directory.data?.[0]?.id || '';
  const defaults = currentDateRange();
  const start = startDate ?? defaults.start;
  const end = endDate ?? defaults.end;
  const history = useQuery({
    queryKey: ['timekeeping', selectedId, start, end],
    enabled: Boolean(selectedId),
    queryFn: ({ signal }) => fetchTimekeeping(selectedId, start, end, signal),
    refetchInterval: 60_000,
  });
  return { ...history, data: history.data ? { ...history.data, users: directory.data ?? [] } : undefined,
    isPending: directory.isPending || (Boolean(selectedId) && history.isPending),
    isError: directory.isError || history.isError, error: directory.error ?? history.error,
    users: directory.data ?? [], selectedId };
}

/** Charge les derniers pointages pour la fiche ; attend un identifiant avant tout appel. */
export function useTimeEntries(id: string | undefined) {
  return useQuery({ queryKey: ['time-entries', id], enabled: Boolean(id),
    queryFn: ({ signal }) => fetchTimeEntries(id!, {}, signal), refetchInterval: 60_000 });
}

/** Charge les heures du lundi à aujourd’hui selon le calendrier de Paris. */
export function useUserHours(id: string | undefined) {
  const range = currentWeekRange();
  const start = range.start;
  return useQuery({ queryKey: ['user-hours', id, start, range.end], enabled: Boolean(id),
    queryFn: ({ signal }) => fetchDailyHours(id!, { start, end: range.end }, signal), refetchInterval: 60_000 });
}

/** Met en cache le résumé d’un employé en distinguant chaque période demandée. */
export function useTimeSummary(id: string | undefined, range: TimeRange = {}) {
  return useQuery({ queryKey: ['time-summary', id, range.start, range.end], enabled: Boolean(id),
    queryFn: ({ signal }) => fetchTimeSummary(id!, range, signal), refetchInterval: 60_000 });
}
