import type { Indicator } from '@/shared/api/client';
import {
  Clock,
  PersonWorker,
  Pulse,
  TriangleExclamation,
} from '@gravity-ui/icons';
import { StatCard } from '@/shared/ui/StatCard';

interface DashboardKpisProps {
  indicators: { attendance_rate: Indicator; avg_weekly_hours: Indicator };
  clockedIn: number;
  alerts: number | null;
  totalEmployees: number;
  attendance: number | null;
  averageWeeklyHours: number;
}

const gridClassName =
  'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 3xl:gap-5 4xl:gap-6';

export function DashboardKpis({
  indicators,
  clockedIn,
  alerts,
  totalEmployees,
  attendance,
  averageWeeklyHours,
}: DashboardKpisProps) {

  return (
    <section
      aria-label='Indicateurs clés'
      className={gridClassName}
    >
      <StatCard
        delta={indicators.attendance_rate.delta}
        trend={indicators.attendance_rate.trend.map((value, i) => ({ label: String(i), value }))}
        icon={Pulse}
        label='Taux de présence'
        unit={attendance === null ? undefined : '%'}
        value={attendance === null ? '—' : String(attendance)}
      />
      <StatCard
        hint='vs période préc.'
        delta={indicators.avg_weekly_hours.delta}
        trend={indicators.avg_weekly_hours.trend.map((value, i) => ({ label: String(i), value }))}
        icon={Clock}
        label='Heures moyennes'
        unit='h'
        value={averageWeeklyHours.toLocaleString('fr-FR', {
          maximumFractionDigits: 2,
})}
      />
      <StatCard
        hint={`sur ${totalEmployees} collaborateurs`}
        icon={PersonWorker}
        label='Ayant pointé aujourd’hui'
        tone='success'
        value={String(clockedIn)}
      />
      <StatCard
        hint='retards + absences'
        icon={TriangleExclamation}
        label='Alertes'
        tone={(alerts ?? 0) > 0 ? 'warning' : 'success'}
        value={alerts === null ? '—' : String(alerts)}
      />
    </section>
  );
}
