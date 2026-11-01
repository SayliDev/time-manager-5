import { request } from '@/shared/api/client';
import type { DayHours } from '@/features/time/types';

export interface WeeklyDto {
  week: number;
  start: string;
  end: string;
  hours: number;
  days_worked: number;
}

export interface DailyHoursDto {
  date: string;
  label: string;
  hours: number;
  onsite: number;
  remote: number;
}

export type WorkMode = 'onsite' | 'remote';

export type SessionStatus = 'ok' | 'late' | 'overtime' | 'missing' | 'ongoing';

export interface WorkSessionDto {
  id_work_session: number;
  date: string;
  start_at: string;
  end_at: string | null;
  hours: number | null;
  mode: WorkMode;
  status: SessionStatus;
}

function toDayHours(dto: DailyHoursDto): DayHours {
  return {
    day: dto.label,
    hours: dto.hours,
    onsite: dto.onsite,
    remote: dto.remote,
  };
}

export async function fetchWeekly(userId: string): Promise<WeeklyDto[]> {
  return await request<WeeklyDto[]>(`/api/users/${userId}/hours/weekly`);
}

export async function fetchDailyHours(
  userId: string,
  from: string,
  to: string,
): Promise<DayHours[]> {
  const params = new URLSearchParams({ from, to });
  const dailyHours = await request<DailyHoursDto[]>(
    `/api/users/${userId}/hours/daily?${params}`,
  );

  return dailyHours.map(toDayHours);
}

export const timeQueryKeys = {
  user: (userId: string) => ['time', userId] as const,

  daily: (userId: string, from: string, to: string) =>
    [...timeQueryKeys.user(userId), 'daily', from, to] as const,

  weekly: (userId: string) =>
    [...timeQueryKeys.user(userId), 'weekly'] as const,
};

export async function clockIn(mode: WorkMode): Promise<WorkSessionDto> {
  return await request<WorkSessionDto>('/api/work-sessions/clock-in', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode }),
  });
}

export async function clockOut(): Promise<WorkSessionDto> {
  return await request<WorkSessionDto>('/api/work-sessions/clock-out', {
    method: 'POST',
  });
}
