export type EntryStatus = 'ok' | 'late' | 'overtime' | 'missing' | 'ongoing';
export type WorkMode = 'onsite' | 'remote' | 'unknown';

export interface TimeEntry {
  id: string;
  date: string;
  arrival: string | null;
  departure: string | null;
  hours: number | null;
  status: EntryStatus;
  mode: WorkMode;
}

export interface DayHours {
  day: string;
  hours: number;
  onsite?: number;
  remote?: number;
}

export interface TimekeepingData {
  users: { id: string; firstName: string; lastName: string }[];
  selectedId: string | null;
  startDate: string;
  endDate: string;
  entries: TimeEntry[];
  hours: DayHours[];
  weekly: {
    id: string;
    label: string;
    range: string;
    hours: number;
    days: number;
  }[];
  stats: {
    total: number;
    averageWeeklyHours: number;
    aboveTargetHours: number;
    averageWeeklyHoursDelta: number;
    lateCount: number;
    missingCount: number;
    days: number;
  };
}
