import type { PresenceStatus } from '@/features/users/types';

export const presenceBars: {
  key: PresenceStatus;
  label: string;
  color: 'success' | 'accent' | 'warning' | 'danger' | 'default';
  swatch: string;
}[] = [
  { key: 'present', label: 'Présents', color: 'success', swatch: 'bg-success' },
  { key: 'remote', label: 'Télétravail', color: 'accent', swatch: 'bg-accent' },
  { key: 'late', label: 'En retard', color: 'warning', swatch: 'bg-warning' },
  { key: 'absent', label: 'Absents', color: 'danger', swatch: 'bg-danger' },
];
