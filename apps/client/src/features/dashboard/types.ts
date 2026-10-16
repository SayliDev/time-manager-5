export interface ActivityItem {
  id: string;
  userId: string;
  type: 'arrival' | 'departure' | 'alert';
  time: string;
  label: string;
}

export type DashboardPeriod = 'week' | 'month';
