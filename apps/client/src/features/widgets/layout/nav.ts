import {
  ChartColumn,
  Clock,
  Gear,
  House,
  Layers3Diagonal,
  Persons,
} from '@gravity-ui/icons';
import type { ComponentType, SVGProps } from 'react';
import type { Role } from '@/features/users/types';

export const APP_BASE = '/dashboard';

export function appPath(path = ''): string {
  if (!path || path === '/') return APP_BASE;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${APP_BASE}${normalized}`;
}

export interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  roles: Role[];
  end?: boolean;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const navSections: NavSection[] = [
  {
    title: 'Général',
    items: [
      {
        to: appPath(),
        label: 'Tableau de bord',
        icon: House,
        roles: ['employee', 'manager'],
        end: true,
      },
      {
        to: appPath('/time'),
        label: 'Pointages',
        icon: Clock,
        roles: ['employee', 'manager'],
      },
    ],
  },
  {
    title: 'Gestion',
    items: [
      {
        to: appPath('/users'),
        label: 'Employés',
        icon: Persons,
        roles: ['manager'],
      },
      {
        to: appPath('/teams'),
        label: 'Équipes',
        icon: Layers3Diagonal,
        roles: ['manager'],
      },
      {
        to: appPath('/reports'),
        label: 'Rapports & KPIs',
        icon: ChartColumn,
        roles: ['manager'],
      },
    ],
  },
  {
    title: 'Compte',
    items: [
      {
        to: appPath('/profile'),
        label: 'Mon compte',
        icon: Gear,
        roles: ['employee', 'manager'],
      },
    ],
  },
];

export const pageTitles: Record<string, string> = {
  [appPath()]: 'Tableau de bord',
  [appPath('/time')]: 'Pointages',
  [appPath('/users')]: 'Employés',
  [appPath('/teams')]: 'Équipes',
  [appPath('/reports')]: 'Rapports & KPIs',
  [appPath('/profile')]: 'Mon compte',
};
