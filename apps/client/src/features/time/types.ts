export type EntryStatus = 'ok' | 'late' | 'overtime' | 'missing' | 'ongoing';

export interface TimeEntry {
  id: string;
  date: string;
  arrival: string | null;
  departure: string | null;
  hours: number;
  status: EntryStatus;
}

export interface DayHours {
  day: string;
  hours: number;
  onsite?: number;
  remote?: number;
}
