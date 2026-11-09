import { Calendar, Clock } from '@gravity-ui/icons';
import { WeeklyGoalCard } from '@/features/dashboard/components/WeeklyGoalCard';
import { useNow } from '@/features/dashboard/hooks/useNow';
import { formatDecimal, formatHours } from '@/shared/lib/format';
import { SkeletonSwap } from '@/shared/ui/SkeletonSwap';
import { StatCard, StatCardSkeleton } from '@/shared/ui/StatCard';

interface EmployeeStatsProps {
  since: string;
  completedToday: number;
  openSessionStart: string | null;
  weekly: number;
  delta: number | undefined;
  isLoading: boolean;
}

export function EmployeeStats({
  since,
  completedToday,
  openSessionStart,
  weekly,
  delta,
  isLoading,
}: EmployeeStatsProps) {
  return (
    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-2 3xl:gap-5 4xl:gap-6'>
      <TodayStatCard
        since={since}
        completedToday={completedToday}
        openSessionStart={openSessionStart}
      />
      <SkeletonSwap
        isLoading={isLoading}
        skeleton={<StatCardSkeleton withDelta />}
      >
        <StatCard
          delta={delta}
          hint={delta !== undefined ? 'vs semaine dernière' : undefined}
          icon={Calendar}
          label='Cette semaine'
          tone='success'
          unit='h'
          value={formatDecimal(weekly)}
        />
      </SkeletonSwap>
      <WeeklyGoalCard weekly={weekly} />
    </div>
  );
}

interface TodayStatCardProps {
  since: string;
  completedToday: number;
  openSessionStart: string | null;
}

// Seule cette carte suit l'horloge, pour ne pas re-rendre toute la page.
function TodayStatCard({
  since,
  completedToday,
  openSessionStart,
}: TodayStatCardProps) {
  const now = useNow();

  // Une session commencée la veille ne compte qu'à partir de minuit.
  const midnight = new Date(now);
  midnight.setHours(0, 0, 0, 0);
  const elapsedHours = openSessionStart
    ? (now.getTime() -
        Math.max(new Date(openSessionStart).getTime(), midnight.getTime())) /
      3_600_000
    : 0;

  return (
    <StatCard
      hint={since ? `depuis ${since}` : undefined}
      icon={Clock}
      label='Aujourd’hui'
      tone='accent'
      value={formatHours(completedToday + elapsedHours)}
    />
  );
}
