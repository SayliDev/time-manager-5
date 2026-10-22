import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  activity,
  kpis,
  monthHours,
  myEntries,
  teams,
  users,
  weekHours,
} from '@/data/mock';
import type { DashboardPeriod } from '@/features/dashboard/types';
import { weeklyRows } from '@/features/time/constants/weeklyRows';

const MIN_LATENCY_MS = 600;
const MAX_LATENCY_MS = 1400;

function simulateRequest<T>(data: T): Promise<T> {
  const latency =
    MIN_LATENCY_MS + Math.random() * (MAX_LATENCY_MS - MIN_LATENCY_MS);
  return new Promise((resolve) => setTimeout(() => resolve(data), latency));
}

export const mockQueryKeys = {
  users: ['users'] as const,
  teams: ['teams'] as const,
  kpis: ['kpis'] as const,
  activity: ['activity'] as const,
  hours: (period: DashboardPeriod) => ['hours', period] as const,
  userHours: (userId: string | undefined) => ['hours', 'user', userId] as const,
  timeEntries: (userId: string | undefined) =>
    ['time-entries', userId] as const,
  weeklySummary: (userId: string | undefined) =>
    ['weekly-summary', userId] as const,
};

export function useUsers() {
  return useQuery({
    queryKey: mockQueryKeys.users,
    queryFn: () => simulateRequest(users),
  });
}

export function useTeams() {
  return useQuery({
    queryKey: mockQueryKeys.teams,
    queryFn: () => simulateRequest(teams),
  });
}

export function useKpis() {
  return useQuery({
    queryKey: mockQueryKeys.kpis,
    queryFn: () => simulateRequest(kpis),
  });
}

export function useActivity() {
  return useQuery({
    queryKey: mockQueryKeys.activity,
    queryFn: () => simulateRequest(activity),
  });
}

/** Heures agrégées de l'équipe. Garde la période précédente affichée pendant le changement. */
export function useHours(period: DashboardPeriod) {
  return useQuery({
    queryKey: mockQueryKeys.hours(period),
    queryFn: () => simulateRequest(period === 'week' ? weekHours : monthHours),
    placeholderData: keepPreviousData,
  });
}

export function useUserHours(userId: string | undefined) {
  return useQuery({
    queryKey: mockQueryKeys.userHours(userId),
    queryFn: () => simulateRequest(weekHours),
    enabled: Boolean(userId),
    placeholderData: keepPreviousData,
  });
}

export function useTimeEntries(userId: string | undefined) {
  return useQuery({
    queryKey: mockQueryKeys.timeEntries(userId),
    queryFn: () => simulateRequest(myEntries),
    enabled: Boolean(userId),
    placeholderData: keepPreviousData,
  });
}

export function useWeeklySummary(userId: string | undefined) {
  return useQuery({
    queryKey: mockQueryKeys.weeklySummary(userId),
    queryFn: () => simulateRequest(weeklyRows),
    enabled: Boolean(userId),
    placeholderData: keepPreviousData,
  });
}
