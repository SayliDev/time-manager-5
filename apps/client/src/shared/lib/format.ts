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

// API instants stay in UTC; display follows the company's calendar.
/** Affiche un instant UTC en heures et minutes à Paris ; conserve une valeur absente. */
export const formatClock = (instant: string | null) => instant
  ? new Date(instant).toLocaleTimeString('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit' })
  : null;

/** Affiche le jour et l’heure de Paris, ou un tiret si aucun pointage n’existe. */
export const formatInstant = (instant: string | null) => instant
  ? new Date(instant).toLocaleString('fr-FR', { timeZone: 'Europe/Paris', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  : '\u2014';

/** Retourne le premier jour du mois et aujourd’hui au format YYYY-MM-DD à Paris. */
export function currentDateRange() {
  const end = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  return { start: `${end.slice(0, 7)}-01`, end };
}

/** Détermine le lundi et aujourd’hui à partir de la date courante de Paris. */
export function currentWeekRange() {
  const { end } = currentDateRange();
  const day = new Date(`${end}T12:00:00Z`);
  day.setUTCDate(day.getUTCDate() - (day.getUTCDay() + 6) % 7);
  return { start: day.toISOString().slice(0, 10), end };
}
