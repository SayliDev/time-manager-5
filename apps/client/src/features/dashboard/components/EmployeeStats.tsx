import { Calendar, Clock } from '@gravity-ui/icons';
import { WeeklyGoalCard } from '@/features/dashboard/components/WeeklyGoalCard';
import { formatDecimal, formatHours } from '@/shared/lib/format';
import { SkeletonSwap } from '@/shared/ui/SkeletonSwap';
import { StatCard, StatCardSkeleton } from '@/shared/ui/StatCard';

interface EmployeeStatsProps {
  since: string;
  today: number;
  weekly: number;
  delta: number | undefined;
  isLoading: boolean;
}

export function EmployeeStats({
  since,
  today,
  weekly,
  delta,
  isLoading,
}: EmployeeStatsProps) {
  return (
    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-2 3xl:gap-5 4xl:gap-6'>
      <StatCard
        hint={since ? `depuis ${since}` : undefined}
        icon={Clock}
        label='Aujourd’hui'
        tone='accent'
        value={formatHours(today)}
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
