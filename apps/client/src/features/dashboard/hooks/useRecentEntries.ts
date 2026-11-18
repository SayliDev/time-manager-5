import { useQuery } from '@tanstack/react-query';
import {
  fetchWorkSessions,
  timeQueryKeys,
  toTimeEntry,
  type WorkSessionDto,
} from '../api/dashboardApi';
import { toIsoDate } from '../lib/week';

function toRecentEntries(sessions: WorkSessionDto[]) {
  return sessions.slice(0, 5).map(toTimeEntry);
}

export function useRecentEntries(userId: string | undefined) {
  const today = new Date();
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);

  const from = toIsoDate(monthAgo);
  const to = toIsoDate(today);

  return useQuery({
    queryKey: timeQueryKeys.sessions(userId ?? '', from, to),
    queryFn: () => fetchWorkSessions(userId!, from, to),
    enabled: Boolean(userId),
    select: toRecentEntries,
  });
}
