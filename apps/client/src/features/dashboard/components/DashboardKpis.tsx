import {
  Clock,
  PersonWorker,
  Pulse,
  TriangleExclamation,
} from '@gravity-ui/icons';
import { kpis } from '@/data/mock';
import { StatCard } from '@/shared/ui/StatCard';

interface DashboardKpisProps {
  clockedIn: number;
  alerts: number;
  totalEmployees: number;
}

export function DashboardKpis({
  clockedIn,
  alerts,
  totalEmployees,
}: DashboardKpisProps) {
  const attendance = kpis.find((k) => k.id === 'attendance')!;
  const avgHours = kpis.find((k) => k.id === 'avgHours')!;

  return (
    <section
      aria-label='Indicateurs clés'
      className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 3xl:gap-5 4xl:gap-6'
    >
      <StatCard
        delta={attendance.delta}
        hint='vs période préc.'
        icon={Pulse}
        label={attendance.label}
        tone='success'
        trend={attendance.trend}
        unit={attendance.unit}
        value={attendance.value}
      />
      <StatCard
        delta={avgHours.delta}
        hint='vs période préc.'
        icon={Clock}
        label={avgHours.label}
        tone='accent'
        trend={avgHours.trend}
        unit={avgHours.unit}
        value={avgHours.value}
      />
      <StatCard
        hint={`sur ${totalEmployees} collaborateurs`}
        icon={PersonWorker}
        label='Pointés maintenant'
        tone='success'
        value={String(clockedIn)}
      />
      <StatCard
        hint='retards + absences'
        icon={TriangleExclamation}
        label='Alertes'
        tone={alerts > 0 ? 'warning' : 'success'}
        value={String(alerts)}
      />
    </section>
  );
}
