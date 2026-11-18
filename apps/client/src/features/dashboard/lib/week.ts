import { pad } from './clock';

export function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function getWorkWeek(today: Date): { from: string; to: string } {
  const daysSinceMonday = (today.getDay() + 6) % 7;

  const monday = new Date(today);
  monday.setDate(today.getDate() - daysSinceMonday);

  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);

  return { from: toIsoDate(monday), to: toIsoDate(friday) };
}
