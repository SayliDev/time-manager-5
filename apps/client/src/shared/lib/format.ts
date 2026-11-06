export const formatDay = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });

export const formatHours = (h: number) => {
  const hours = Math.floor(h);
  const minutes = Math.round((h - hours) * 60);
  return `${hours} h ${String(minutes).padStart(2, '0')}`;
};

export const formatDecimal = (n: number) => n.toFixed(1).replace('.', ',');

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return 'Non renseignée';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Non renseignée';
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'Europe/Paris',
  }).format(date);
}
