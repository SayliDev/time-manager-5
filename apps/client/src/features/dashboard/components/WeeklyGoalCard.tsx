import { CircleInfo } from '@gravity-ui/icons';
import { Card, Label, ProgressBar } from '@heroui/react';
import { WEEKLY_TARGET_HOURS } from '@/features/time/constants/weeklyRows';
import { formatDecimal } from '@/shared/lib/format';
import { DemoBadge } from '@/shared/ui/DemoBadge';

interface WeeklyGoalCardProps {
  weekly: number;
}

export function WeeklyGoalCard({ weekly }: WeeklyGoalCardProps) {
  const remaining = Math.max(0, WEEKLY_TARGET_HOURS - weekly);
  const progress = Math.min(100, (weekly / WEEKLY_TARGET_HOURS) * 100);

  return (
    <Card className='gap-3 sm:col-span-2'>
      <ProgressBar aria-label='Progression hebdomadaire' value={progress}>
        <div className='flex items-baseline justify-between'>
          <div className='flex items-center gap-2'>
            <Label>Objectif hebdomadaire</Label>
            <DemoBadge />
          </div>
          <span className='tabular text-sm text-muted'>
            <strong className='text-base font-semibold text-foreground'>
              {formatDecimal(weekly)} h
            </strong>{' '}
            / {WEEKLY_TARGET_HOURS} h
          </span>
        </div>
        <ProgressBar.Track>
          <ProgressBar.Fill />
        </ProgressBar.Track>
      </ProgressBar>
      <p className='flex items-center gap-1.5 text-xs text-muted'>
        <CircleInfo className='size-3.5' />
        {remaining > 0
          ? `Il vous reste ${formatDecimal(remaining)} h pour atteindre votre objectif.`
          : 'Objectif de la semaine atteint.'}
      </p>
    </Card>
  );
}
