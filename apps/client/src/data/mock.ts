/* ------------------------------------------------------------------ */
/*  Données fictives — uniquement pour la maquette UI                  */
/* ------------------------------------------------------------------ */

import type { Team } from '@/features/teams/types';
import type { User } from '@/features/users/types';
import type { DayHours, TimeEntry } from '@/features/time/types';
import type { ActivityItem } from '@/features/dashboard/types';
import type { Kpi } from '@/features/reports/types';

export const users: User[] = [
  {
    id: 'u1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@trinitymarket.com',
    phone: '+33 6 12 34 56 78',
    role: 'manager',
    teamId: 't1',
    presence: 'present',
    weeklyHours: 36.5,
    lastClock: 'Arrivée 08:52',
  },
  {
    id: 'u2',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@trinitymarket.com',
    phone: '+33 6 98 76 54 32',
    role: 'employee',
    teamId: 't1',
    presence: 'present',
    weeklyHours: 34.2,
    lastClock: 'Arrivée 08:57',
  },
  {
    id: 'u3',
    firstName: 'Sara',
    lastName: 'Moreau',
    email: 'sara.moreau@trinitymarket.com',
    phone: '+33 6 22 11 33 44',
    role: 'employee',
    teamId: 't1',
    presence: 'late',
    weeklyHours: 41.2,
    lastClock: 'Arrivée 09:41',
  },
  {
    id: 'u4',
    firstName: 'Thomas',
    lastName: 'Girard',
    email: 'thomas.girard@trinitymarket.com',
    phone: '+33 7 45 12 89 02',
    role: 'employee',
    teamId: 't2',
    presence: 'remote',
    weeklyHours: 37.8,
    lastClock: 'Arrivée 08:30',
  },
  {
    id: 'u5',
    firstName: 'Lina',
    lastName: 'Haddad',
    email: 'lina.haddad@trinitymarket.com',
    phone: '+33 6 71 52 08 19',
    role: 'employee',
    teamId: 't2',
    presence: 'present',
    weeklyHours: 35.0,
    lastClock: 'Arrivée 09:02',
  },
  {
    id: 'u6',
    firstName: 'Hugo',
    lastName: 'Lefèvre',
    email: 'hugo.lefevre@trinitymarket.com',
    phone: '+33 6 40 30 20 10',
    role: 'employee',
    teamId: 't2',
    presence: 'absent',
    weeklyHours: 22.5,
    lastClock: 'Départ hier 17:30',
  },
  {
    id: 'u7',
    firstName: 'Camille',
    lastName: 'Roux',
    email: 'camille.roux@trinitymarket.com',
    phone: '+33 6 55 66 77 88',
    role: 'manager',
    teamId: 't3',
    presence: 'present',
    weeklyHours: 38.0,
    lastClock: 'Arrivée 08:15',
  },
  {
    id: 'u8',
    firstName: 'Yanis',
    lastName: 'Mercier',
    email: 'yanis.mercier@trinitymarket.com',
    phone: '+33 7 11 22 33 44',
    role: 'employee',
    teamId: 't3',
    presence: 'present',
    weeklyHours: 39.4,
    lastClock: 'Arrivée 08:45',
  },
  {
    id: 'u9',
    firstName: 'Emma',
    lastName: 'Fontaine',
    email: 'emma.fontaine@trinitymarket.com',
    phone: '+33 6 90 80 70 60',
    role: 'employee',
    teamId: 't3',
    presence: 'remote',
    weeklyHours: 35.6,
    lastClock: 'Arrivée 09:10',
  },
  {
    id: 'u10',
    firstName: 'Nolan',
    lastName: 'Petit',
    email: 'nolan.petit@trinitymarket.com',
    phone: '+33 6 01 02 03 04',
    role: 'employee',
    teamId: 't4',
    presence: 'off',
    weeklyHours: 28.0,
    lastClock: 'Congé',
  },
  {
    id: 'u11',
    firstName: 'Inès',
    lastName: 'Garnier',
    email: 'ines.garnier@trinitymarket.com',
    phone: '+33 6 19 28 37 46',
    role: 'employee',
    teamId: 't4',
    presence: 'present',
    weeklyHours: 36.1,
    lastClock: 'Arrivée 08:58',
  },
  {
    id: 'u12',
    firstName: 'Karim',
    lastName: 'Sellami',
    email: 'karim.sellami@trinitymarket.com',
    phone: '+33 7 65 43 21 09',
    role: 'manager',
    teamId: 't4',
    presence: 'present',
    weeklyHours: 40.2,
    lastClock: 'Arrivée 08:20',
  },
];

export const teams: Team[] = [
  {
    id: 't1',
    name: 'Ressources humaines',
    description: 'Recrutement, paie et vie au travail.',
    managerId: 'u1',
    memberIds: ['u1', 'u2', 'u3'],
    avgWeeklyHours: 37.3,
    attendanceRate: 94,
  },
  {
    id: 't2',
    name: 'Finance',
    description: 'Comptabilité, trésorerie et contrôle de gestion.',
    managerId: 'u1',
    memberIds: ['u4', 'u5', 'u6'],
    avgWeeklyHours: 31.7,
    attendanceRate: 82,
  },
  {
    id: 't3',
    name: 'IT & Produit',
    description: 'Développement, infrastructure et support interne.',
    managerId: 'u7',
    memberIds: ['u7', 'u8', 'u9'],
    avgWeeklyHours: 37.7,
    attendanceRate: 96,
  },
  {
    id: 't4',
    name: 'Opérations',
    description: 'Logistique, approvisionnement et service client.',
    managerId: 'u12',
    memberIds: ['u10', 'u11', 'u12'],
    avgWeeklyHours: 34.8,
    attendanceRate: 88,
  },
];

export const weekHours: DayHours[] = [
  { day: 'Lun', hours: 7.6 },
  { day: 'Mar', hours: 7.9 },
  { day: 'Mer', hours: 7.2 },
  { day: 'Jeu', hours: 8.1 },
  { day: 'Ven', hours: 6.8 },
];

export const monthHours: DayHours[] = [
  { day: 'S1', hours: 36.8 },
  { day: 'S2', hours: 38.4 },
  { day: 'S3', hours: 35.9 },
  { day: 'S4', hours: 37.6 },
];

export const myEntries: TimeEntry[] = [
  {
    id: 'e1',
    date: '2026-10-07',
    arrival: '08:57',
    departure: null,
    hours: 4.4,
    status: 'ongoing',
  },
  {
    id: 'e2',
    date: '2026-10-06',
    arrival: '08:49',
    departure: '17:36',
    hours: 7.8,
    status: 'ok',
  },
  {
    id: 'e3',
    date: '2026-10-05',
    arrival: '09:24',
    departure: '18:02',
    hours: 7.6,
    status: 'late',
  },
  {
    id: 'e4',
    date: '2026-10-02',
    arrival: '08:30',
    departure: '19:14',
    hours: 9.6,
    status: 'overtime',
  },
  {
    id: 'e5',
    date: '2026-10-01',
    arrival: '08:55',
    departure: '17:20',
    hours: 7.4,
    status: 'ok',
  },
  {
    id: 'e6',
    date: '2026-09-30',
    arrival: '09:00',
    departure: null,
    hours: 0,
    status: 'missing',
  },
  {
    id: 'e7',
    date: '2026-09-29',
    arrival: '08:44',
    departure: '17:30',
    hours: 7.9,
    status: 'ok',
  },
  {
    id: 'e8',
    date: '2026-09-28',
    arrival: '08:51',
    departure: '17:41',
    hours: 8.0,
    status: 'ok',
  },
];

export const activity: ActivityItem[] = [
  {
    id: 'a1',
    userId: 'u2',
    type: 'arrival',
    time: '08:57',
    label: 'a pointé son arrivée',
  },
  {
    id: 'a2',
    userId: 'u3',
    type: 'alert',
    time: '09:41',
    label: 'est arrivée en retard (+41 min)',
  },
  {
    id: 'a3',
    userId: 'u4',
    type: 'arrival',
    time: '08:30',
    label: 'a pointé en télétravail',
  },
  {
    id: 'a4',
    userId: 'u8',
    type: 'arrival',
    time: '08:45',
    label: 'a pointé son arrivée',
  },
  {
    id: 'a5',
    userId: 'u6',
    type: 'alert',
    time: '08:00',
    label: 'n’a pas pointé depuis 2 jours',
  },
  {
    id: 'a6',
    userId: 'u11',
    type: 'departure',
    time: '07:55',
    label: 'a pointé son départ (nuit)',
  },
];

const sparkline = (values: number[], labels: string[]) =>
  values.map((value, i) => ({ label: labels[i], value }));

const weeks = ['S-5', 'S-4', 'S-3', 'S-2', 'S-1', 'Cette sem.'];

export const kpis: Kpi[] = [
  {
    id: 'attendance',
    label: 'Taux de présence',
    description: 'Part des jours ouvrés avec au moins un pointage.',
    value: '92',
    unit: '%',
    delta: 3.1,
    positiveIsGood: true,
    trend: sparkline([86, 88, 87, 90, 89, 92], weeks),
  },
  {
    id: 'avgHours',
    label: 'Heures moy. / semaine',
    description: 'Moyenne des heures travaillées par employé.',
    value: '36,8',
    unit: 'h',
    delta: 1.4,
    positiveIsGood: true,
    trend: sparkline([35.2, 36.1, 35.8, 36.9, 36.3, 36.8], weeks),
  },
  {
    id: 'overtime',
    label: 'Heures supplémentaires',
    description: 'Total des heures au-delà de 35 h / semaine.',
    value: '47',
    unit: 'h',
    delta: 12.5,
    positiveIsGood: false,
    trend: sparkline([30, 34, 38, 36, 42, 47], weeks),
  },
  {
    id: 'punctuality',
    label: 'Ponctualité',
    description: 'Arrivées avant 09:15 sur la période.',
    value: '88',
    unit: '%',
    delta: -2.2,
    positiveIsGood: true,
    trend: sparkline([91, 90, 92, 89, 90, 88], weeks),
  },
];

/** Employé « connecté » dans la démo, selon le rôle choisi */
export const CURRENT_MANAGER_ID = 'u1';
export const CURRENT_EMPLOYEE_ID = 'u2';

export const getUser = (id: string | null | undefined) =>
  users.find((u) => u.id === id);
export const getTeam = (id: string | null | undefined) =>
  teams.find((t) => t.id === id);
export const fullName = (u: Pick<User, 'firstName' | 'lastName'>) =>
  `${u.firstName} ${u.lastName}`;
export const initials = (u: Pick<User, 'firstName' | 'lastName'>) =>
  `${u.firstName[0]}${u.lastName[0]}`;
