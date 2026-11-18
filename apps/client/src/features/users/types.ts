export type ContractHours = 35 | 20 | 30 | 25;
export const CONTRACT_HOURS: ContractHours[] = [35, 20, 30, 25];

export type Role = 'admin' | 'manager' | 'employee';
export type PresenceStatus = 'present' | 'remote' | 'late' | 'absent' | 'off';
export type EntryStatus = 'ok' | 'late' | 'overtime' | 'missing' | 'ongoing';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: Role;
  createdAt: string | null;
  deactivatedAt: string | null;
  // renseignés uniquement dans les données de démo.
  teamId: string | null;
  teamName?: string | null;
  presence: PresenceStatus | null;
  weeklyHours: number | null;
  contractHours: ContractHours;
  lastClock: string | null;
}

export interface CreateUserInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  contractHours?: ContractHours;
  role: Role;
  phone: string | null;
}
