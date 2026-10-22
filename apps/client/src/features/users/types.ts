export type Role = string;
export type PresenceStatus = 'present' | 'remote' | 'late' | 'absent' | 'off';
export type EntryStatus = 'ok' | 'late' | 'overtime' | 'missing' | 'ongoing';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: Role;
  teamId: string | null;
  teamName?: string | null;
  presence: PresenceStatus;
  weeklyHours: number;
  lastClock: string;
}
