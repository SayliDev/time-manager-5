import { Card } from '@heroui/react';
import { useHours } from '@/data/mockQueries';
import type { DashboardPeriod } from '@/features/dashboard/types';
import { ChartSkeleton } from '@/shared/charts/ChartSkeleton';
import { HoursBarChart } from '@/shared/charts/HoursBarChart';
import { SkeletonSwap } from '@/shared/ui/SkeletonSwap';

interface HoursOverviewCardProps {
  period: DashboardPeriod;
}

export function HoursOverviewCard({ period }: HoursOverviewCardProps) {
  const { data, isPending, isPlaceholderData } = useHours(period);

  return (
    <Card className='lg:col-span-2'>
      <Card.Header>
        <Card.Title>
          {period === 'week'
            ? 'Présentiel vs télétravail'
            : 'Présentiel vs télétravail (mois)'}
        </Card.Title>
        <Card.Description>
          Comparaison des heures moyennes{' '}
          {period === 'week' ? 'par jour' : 'par semaine'} · objectif en
          pointillés
        </Card.Description>
      </Card.Header>
      <Card.Content aria-busy={isPlaceholderData}>
        <SkeletonSwap
          isLoading={isPending}
          skeleton={<ChartSkeleton grouped bars={period === 'week' ? 7 : 4} />}
        >
          <div
            className={`transition-opacity duration-300 ${
              isPlaceholderData ? 'opacity-50' : 'opacity-100'
            }`}
          >
            <HoursBarChart
              compareModes
              data={data ?? []}
              target={period === 'week' ? 7 : 35}
              targetLabel={period === 'week' ? '7 h' : '35 h'}
            />
          </div>
        </SkeletonSwap>
      </Card.Content>
    </Card>
  );
}
