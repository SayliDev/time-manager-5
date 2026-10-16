import { Card } from '@heroui/react';
import { monthHours, weekHours } from '@/data/mock';
import type { DashboardPeriod } from '@/features/dashboard/types';
import { HoursBarChart } from '@/shared/charts/HoursBarChart';

interface HoursOverviewCardProps {
  period: DashboardPeriod;
}

export function HoursOverviewCard({ period }: HoursOverviewCardProps) {
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
      <Card.Content>
        <HoursBarChart
          compareModes
          data={period === 'week' ? weekHours : monthHours}
          target={period === 'week' ? 7 : 35}
          targetLabel={period === 'week' ? '7 h' : '35 h'}
        />
      </Card.Content>
    </Card>
  );
}
