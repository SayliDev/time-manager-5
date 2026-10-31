import { Calendar, Clock } from '@gravity-ui/icons';
import { WeeklyGoalCard } from '@/features/dashboard/components/WeeklyGoalCard';
import { formatDecimal } from '@/shared/lib/format';
import { DemoBadge } from '@/shared/ui/DemoBadge';
import { StatCard } from '@/shared/ui/StatCard';

interface EmployeeStatsProps {
  since: string;
  weekly: number;
}

export function EmployeeStats({ since, weekly }: EmployeeStatsProps) {
  return (
    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-2 3xl:gap-5 4xl:gap-6'>
      <StatCard
        badge={<DemoBadge />}
        hint={`depuis ${since}`}
        icon={Clock}
        label='Aujourd’hui'
        tone='accent'
        value='4 h 24'
      />
      <StatCard
        badge={<DemoBadge />}
        delta={2.4}
        hint='vs semaine dernière'
        icon={Calendar}
        label='Cette semaine'
        tone='success'
        unit='h'
        value={formatDecimal(weekly)}
      />
      <WeeklyGoalCard weekly={weekly} />
    </div>
  );
}
