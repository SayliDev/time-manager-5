import { queryOptions, useQuery } from '@tanstack/react-query';
import {
  fetchWorkSessions,
  timeQueryKeys,
  type WorkSessionDto,
} from '../api/dashboardApi';
import { toIsoDate } from '../lib/week';

// La session ouverte peut avoir commencé la veille (travail de nuit) :
// l'API la garde en cours 12 h, puis la marque missing.
function findOpenSession(sessions: WorkSessionDto[]): WorkSessionDto | null {
  return (
    sessions.find((s) => s.end_at === null && s.status === 'ongoing') ?? null
  );
}

function recentSessionsOptions(id: string | undefined) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const from = toIsoDate(yesterday);
  const to = toIsoDate(today);

  return queryOptions({
    queryKey: timeQueryKeys.sessions(id ?? '', from, to),
    queryFn: () => fetchWorkSessions(id!, from, to),
    enabled: Boolean(id),
  });
}

export function useTodaySession(id: string | undefined) {
  return useQuery({
    ...recentSessionsOptions(id),
    select: findOpenSession,
  });
}

function sumCompletedHoursToday(sessions: WorkSessionDto[]): number {
  const today = toIsoDate(new Date());
  return sessions
    .filter((s) => s.date === today)
    .reduce((total, s) => total + (s.hours ?? 0), 0);
}

export function useTodayHours(id: string | undefined) {
  return useQuery({
    ...recentSessionsOptions(id),
    select: sumCompletedHoursToday,
  });
}
