import type { ComponentProps } from 'react';
import type { HoursBarChart } from '@/shared/charts/HoursBarChart';
import type { User } from '@/features/users/types';
import type { ActivityItem, DashboardPeriod } from './types';

export interface DashboardData {
  teams: { id: string; name: string }[];
  users: User[];
  hours: ComponentProps<typeof HoursBarChart>['data'];
  activity: ActivityItem[];
  stats: {
    clockedIn: number;
    clockedToday: number;
    attendance: number | null;
    alerts: number | null;
    averageWeeklyHours: number;
  };
  presence: Record<string, number | null>;
  referenceDate: string;
}

const API_URL =
  import.meta.env.VITE_API_URL ?? 'http://localhost:8001';

const REFERENCE_DATE: string =
  import.meta.env.VITE_DASHBOARD_REFERENCE_DATE ?? '';


export async function fetchDashboard(
  teamId: string,
  period: DashboardPeriod,
  signal: AbortSignal,
): Promise<DashboardData> {
  const params = new URLSearchParams({ period });

  if (teamId !== 'all') {
    params.set('team_id', teamId);
  }

  if (REFERENCE_DATE) {
    params.set('reference_date', REFERENCE_DATE);
  }

  const token = localStorage.getItem('access_token');

  const response = await fetch(`${API_URL}/dashboard?${params}`, {
    signal,
    credentials: 'include',
    headers: token
      ? { Authorization: `Bearer ${token}` }
      : {},
  });

  if (!response.ok) {
    throw new Error(
      `Chargement du dashboard impossible (HTTP ${response.status}).`,
    );
  }

  return response.json();
}