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
