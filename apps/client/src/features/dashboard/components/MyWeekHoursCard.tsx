import { ChartSkeleton } from '@/shared/charts/ChartSkeleton';
import { HoursBarChart } from '@/shared/charts/HoursBarChart';
import { SkeletonSwap } from '@/shared/ui/SkeletonSwap';
import { Card } from '@heroui/react';
import { useDaily } from '../hooks/useDaily';
import { getWorkWeek } from '../lib/week';

interface MyWeekHoursCardProps {
  userId: string | undefined;
}

export function MyWeekHoursCard({ userId }: MyWeekHoursCardProps) {
  const { from, to } = getWorkWeek(new Date());
  const { data, isPending } = useDaily(userId, from, to);

  return (
    <Card>
      <Card.Header>
        <div className='flex items-center justify-between gap-2'>
          <Card.Title>Mes heures de la semaine</Card.Title>
        </div>
        <Card.Description>Par jour · objectif 7 h</Card.Description>
      </Card.Header>
      <Card.Content>
        <SkeletonSwap
          isLoading={isPending}
          skeleton={<ChartSkeleton bars={5} height={220} />}
        >
          <HoursBarChart data={data ?? []} height={220} target={7} />
        </SkeletonSwap>
      </Card.Content>
    </Card>
  );
}
