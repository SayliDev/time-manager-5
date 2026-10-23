import { Clock, Persons, Pulse, TriangleExclamation } from '@gravity-ui/icons';
import { useDemoPresence, useKpis } from '@/data/mockQueries';
import { isManagerRole } from '@/features/users/lib/names';
import type { User } from '@/features/users/types';
import { DemoBadge } from '@/shared/ui/DemoBadge';
import { SkeletonSwap } from '@/shared/ui/SkeletonSwap';
import { StatCard, StatCardSkeleton } from '@/shared/ui/StatCard';

interface DashboardKpisProps {
  users: User[];
  isLoading?: boolean;
}

const gridClassName =
  'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 3xl:gap-5 4xl:gap-6';

export function DashboardKpis({
  users,
  isLoading = false,
}: DashboardKpisProps) {
  const kpis = useKpis();
  const presence = useDemoPresence();

  const attendance = kpis.data?.find((k) => k.id === 'attendance');
  const avgHours = kpis.data?.find((k) => k.id === 'avgHours');
  const alerts = (presence.data ?? []).filter(
    (u) => u.presence === 'late' || u.presence === 'absent',
  ).length;
  const managers = users.filter((u) => isManagerRole(u.role)).length;

  const loading =
    isLoading ||
    kpis.isPending ||
    presence.isPending ||
    !attendance ||
    !avgHours;

  return (
    <section aria-label='Indicateurs clés'>
      <SkeletonSwap
        isLoading={loading}
        skeleton={
          <div className={gridClassName}>
            <StatCardSkeleton withDelta withTrend />
            <StatCardSkeleton withDelta withTrend />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
        }
      >
        {attendance && avgHours ? (
          <div className={gridClassName}>
            <StatCard
              badge={<DemoBadge />}
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
              badge={<DemoBadge />}
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
              hint={`dont ${managers} manager${managers > 1 ? 's' : ''}`}
              icon={Persons}
              label='Collaborateurs actifs'
              tone='accent'
              value={String(users.length)}
            />
            <StatCard
              badge={<DemoBadge />}
              hint='retards + absences'
              icon={TriangleExclamation}
              label='Alertes'
              tone={alerts > 0 ? 'warning' : 'success'}
              value={String(alerts)}
            />
          </div>
        ) : null}
      </SkeletonSwap>
    </section>
  );
}
