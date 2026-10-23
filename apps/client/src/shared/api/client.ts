import type { LoginCredentials, SessionUser, TokenResponse } from '@/features/auth/types';
import type { User, PresenceStatus, Role } from '@/features/users/types';
import type { Team } from '@/features/teams/types';
import type { EntryStatus, TimeEntry, DayHours, TimekeepingData } from '@/features/time/types';
import type { ActivityItem, DashboardPeriod } from '@/features/dashboard/types';
import { formatClock, formatInstant, currentDateRange } from '@/shared/lib/format';

import { tokenStorage } from '@/features/auth/api/tokenStorage';

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8001';

export class ApiError extends Error {
  readonly status: number;
  readonly detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: BodyInit | null;
  headers?: HeadersInit;
  auth?: boolean;
  signal?: AbortSignal;
};

/** Extrait le message FastAPI « detail », avec repli si le serveur ne renvoie pas du JSON. */
async function parseErrorDetail(response: Response): Promise<string> {
  try {
    const data: unknown = await response.json();
    if (
      typeof data === 'object' &&
      data !== null &&
      'detail' in data &&
      typeof data.detail === 'string'
    ) {
      return data.detail;
    }
  } catch {
    // ignore non-JSON bodies
  }
  return response.statusText || 'Une erreur est survenue.';
}

/** Envoie une requête authentifiée avec cookies et annulation.
 * Propage les erreurs sous forme d’ApiError et retourne undefined pour une réponse 204.
 * Le type générique décrit le contrat attendu, sans validation du JSON à l’exécution. */
export async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'GET', body = null, headers, auth = true, signal } = options;

  const nextHeaders = new Headers(headers);

  if (auth) {
    const token = tokenStorage.get();
    if (token) {
      nextHeaders.set('Authorization', `Bearer ${token}`);
    }
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    credentials: 'include',
    signal,
    headers: nextHeaders,
    body,
  });

  if (!response.ok) {
    throw new ApiError(response.status, await parseErrorDetail(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

/** Encode les champs du formulaire OAuth2 attendu par la route de connexion. */
export function formBody(data: Record<string, string>): URLSearchParams {
  return new URLSearchParams(data);
}

// Authentication

type MeResponse = {
  username: string;
};

/** Échange email et mot de passe contre un token, sans joindre de Bearer existant. */
export async function login(
  credentials: LoginCredentials
): Promise<TokenResponse> {
  return request<TokenResponse>('/api/auth/login', {
    method: 'POST',
    auth: false,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formBody({
      username: credentials.email,
      password: credentials.password,
    }),
  });
}

/** Vérifie la session et adapte le champ historique username en identifiant du front. */
export async function getMe(): Promise<SessionUser> {
  const me = await request<MeResponse>('/me');
  return { id: me.username };
}

export const authQueryKeys = {
  all: ['auth'] as const,
  session: ['auth', 'session'] as const,
};

// Directory

/** Charge les collaborateurs autorisés et formate leur dernier pointage en heure de Paris. */
export function fetchUsers(signal?: AbortSignal) {
  return request<User[]>('/api/directory', { signal }).then(users => users.map(user => ({
    ...user, lastClock: user.lastClock && user.lastClock.includes('T') ? formatInstant(user.lastClock) : '\u2014',
  })));
}

// Timekeeping

export interface WorkSession {
  id_work_session: number;
  date: string;
  start_at: string;
  end_at: string | null;
  hours: number | null;
  mode: 'onsite' | 'remote';
  status: EntryStatus;
}
interface DailyHours { date: string; label: string; hours: number; onsite: number; remote: number }
interface WeeklyHours { week: number; start: string; end: string; hours: number; days_worked: number }
export interface TimeSummary {
  total_hours: number;
  avg_weekly_hours: number;
  avg_weekly_hours_delta: number;
  overtime_hours: number;
  late_count: number;
  missing_count: number;
}
export interface TimeRange { start?: string; end?: string }

/** Construit une route employé avec identifiant encodé et bornes from/to inclusives. */
function userPath(id: string, resource: string, range: TimeRange) {
  const params = new URLSearchParams();
  if (range.start) params.set('from', range.start);
  if (range.end) params.set('to', range.end);
  return `/api/users/${encodeURIComponent(id)}/${resource}?${params}`;
}

/** Adapte les sessions API pour le tableau ; conserve null pour une durée encore inconnue. */
export async function fetchTimeEntries(id: string, range: TimeRange = {}, signal?: AbortSignal): Promise<TimeEntry[]> {
  const sessions = await request<WorkSession[]>(userPath(id, 'work-sessions', range), { signal });
  return sessions.map(session => ({ id: String(session.id_work_session), date: session.date,
    arrival: formatClock(session.start_at), departure: formatClock(session.end_at),
    hours: session.hours, mode: session.mode, status: session.status }));
}

/** Prépare les heures quotidiennes par mode en conservant la date complète comme libellé. */
export async function fetchDailyHours(id: string, range: TimeRange = {}, signal?: AbortSignal): Promise<DayHours[]> {
  const days = await request<DailyHours[]>(userPath(id, 'hours/daily', range), { signal });
  return days.map(day => ({ day: day.date, hours: day.hours, onsite: day.onsite, remote: day.remote }));
}

/** Adapte les semaines et jours travaillés au tableau récapitulatif du front. */
export async function fetchWeeklyHours(id: string, range: TimeRange = {}, signal?: AbortSignal) {
  const weeks = await request<WeeklyHours[]>(userPath(id, 'hours/weekly', range), { signal });
  return weeks.map(week => ({ id: week.start, label: `Semaine ${week.week}`,
    range: `${week.start} \u2013 ${week.end}`, hours: week.hours, days: week.days_worked }));
}

/** Charge les KPI calculés par le serveur, notamment l’écart à l’objectif contractuel. */
export function fetchTimeSummary(id: string, range: TimeRange = {}, signal?: AbortSignal) {
  return request<TimeSummary>(userPath(id, 'time-summary', range), { signal });
}

/** Charge en parallèle les quatre ressources de pointage avec les mêmes dates.
 * Utilise le mois courant par défaut et assemble les données attendues par la page. */
export async function fetchTimekeeping(userId: string, startDate?: string, endDate?: string, signal?: AbortSignal): Promise<Omit<TimekeepingData, 'users'>> {
  const defaults = currentDateRange();
  const range = { start: startDate ?? defaults.start, end: endDate ?? defaults.end };
  const [entries, hours, weekly, summary] = await Promise.all([
    fetchTimeEntries(userId, range, signal), fetchDailyHours(userId, range, signal),
    fetchWeeklyHours(userId, range, signal), fetchTimeSummary(userId, range, signal),
  ]);
  return { selectedId: userId, startDate: range.start, endDate: range.end, entries, hours, weekly,
    stats: { total: summary.total_hours, averageWeeklyHours: summary.avg_weekly_hours,
      averageWeeklyHoursDelta: summary.avg_weekly_hours_delta, aboveTargetHours: summary.overtime_hours,
      lateCount: summary.late_count, missingCount: summary.missing_count,
      days: weekly.reduce((sum, week) => sum + week.days, 0) } };
}

/** Pointe l’arrivée du compte connecté ; un doublon est propagé comme erreur HTTP 409. */
export function clockIn(mode: 'onsite' | 'remote') {
  return request<WorkSession>('/api/work-sessions/clock-in', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode }) });
}

/** Pointe le départ du compte connecté, sans corps ; propage le conflit si aucune session n’est ouverte. */
export function clockOut() {
  return request<WorkSession>('/api/work-sessions/clock-out', { method: 'POST' });
}

// Dashboard

export interface Indicator { value: number; delta: number; trend: number[] }
export interface DashboardKpiData { attendance_rate: Indicator; avg_weekly_hours: Indicator; alerts: number }
interface Presence { id_user: number; presence: PresenceStatus; weekly_hours: number; last_clock_at: string | null }
interface Activity { id: number; id_user: number; type: ActivityItem['type']; at: string; label: string }
interface Hours { label: string; onsite: number; remote: number }

export interface DashboardData {
  teams: Team[];
  users: User[];
  hours: { day: string; onsite: number; remote: number; hours: number }[];
  activity: ActivityItem[];
  stats: { clockedToday: number };
  kpis: DashboardKpiData;
}

/** Charge les ressources du dashboard en parallèle et applique le même filtre d’équipe.
 * Joint les présences avec l’annuaire par identifiant ; « all » omet le filtre team_id.
 * Un échec est propagé à la page pour éviter d’afficher un dashboard partiellement incohérent. */
export async function fetchDashboard(teamId: string, period: DashboardPeriod, signal: AbortSignal): Promise<DashboardData> {
  const params = new URLSearchParams({ period });
  if (teamId !== 'all') params.set('team_id', teamId);
  const [teams, directory, kpis, hours, presence, activity] = await Promise.all([
    fetchTeams(signal), fetchUsers(signal),
    request<DashboardKpiData>(`/api/dashboard/kpis?${params}`, { signal }),
    request<Hours[]>(`/api/dashboard/hours?${params}`, { signal }),
    request<Presence[]>(`/api/dashboard/presence?${params}`, { signal }),
    request<Activity[]>(`/api/dashboard/activity?${params}&limit=10`, { signal }),
  ]);
  const usersById = new Map(directory.map(user => [user.id, user]));
  const users = presence.flatMap(state => {
    const user = usersById.get(String(state.id_user));
    return user ? [{ ...user, presence: state.presence, weeklyHours: state.weekly_hours,
      lastClock: formatInstant(state.last_clock_at) }] : [];
  });
  return { teams, users, kpis,
    hours: hours.map(day => ({ day: day.label, onsite: day.onsite, remote: day.remote, hours: day.onsite + day.remote })),
    activity: activity.map(event => ({ id: String(event.id), userId: String(event.id_user),
      type: event.type, time: formatInstant(event.at), label: event.label })),
    stats: { clockedToday: users.filter(user => ['present', 'remote', 'late'].includes(user.presence)).length },
  };
}

// Teams and connected profile

export interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
}

/** Liste uniquement les équipes accessibles au compte connecté. */
export function fetchTeams(signal?: AbortSignal) {
  return request<Team[]>('/api/teams', { signal });
}

/** Charge le profil connecté pour la navigation et l’état sans équipe du dashboard. */
export function fetchProfile(signal?: AbortSignal) {
  return request<Profile>('/api/session', { signal });
}

/** Construit l’URL de redirection Microsoft depuis la même base que les appels API. */
export function getMicrosoftLoginUrl() {
  return `${API_URL}/api/auth/login/microsoft`;
}
