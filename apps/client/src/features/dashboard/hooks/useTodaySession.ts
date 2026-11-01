import { useQuery } from '@tanstack/react-query';
import {
  fetchWorkSessions,
  timeQueryKeys,
  type WorkSessionDto,
} from '../api/dashboardApi';
import { toIsoDate } from '../lib/week';

function findOpenSession(sessions: WorkSessionDto[]): WorkSessionDto | null {
  return sessions.find((s) => s.end_at === null) ?? null;
}

export function useTodaySession(id: string | undefined) {
  const today = toIsoDate(new Date());

  return useQuery({
    queryKey: timeQueryKeys.sessions(id ?? '', today, today),
    queryFn: () => fetchWorkSessions(id!, today, today),
    enabled: Boolean(id),
    select: findOpenSession,
  });
}

function sumCompletedHours(sessions: WorkSessionDto[]): number {
  return sessions.reduce((total, s) => total + (s.hours ?? 0), 0);
}

export function useTodayHours(id: string | undefined) {
  const today = toIsoDate(new Date());

  return useQuery({
    queryKey: timeQueryKeys.sessions(id ?? '', today, today),
    queryFn: () => fetchWorkSessions(id!, today, today),
    enabled: Boolean(id),
    select: sumCompletedHours,
  });
}
