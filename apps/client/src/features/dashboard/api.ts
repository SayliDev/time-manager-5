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
    attendance: number | null;
    alerts: number | null;
    averageWeeklyHours: number;
  };
  presence: Record<string, number | null>;
  referenceDate: string;
}

const API_URL = 'http://localhost:8001';

// Vide = date réelle. Pour ton jeu de test : '2026-10-02'.
const REFERENCE_DATE: string = '';

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

  const response = await fetch(`${API_URL}/dashboard?${params}`, {
    signal,
  });

  if (!response.ok) {
    throw new Error(
      `Chargement du dashboard impossible (HTTP ${response.status}).`,
    );
  }

  return response.json();
}