import { Card } from '@heroui/react';
import type { DayHours } from '@/features/time/types';
import type { DashboardPeriod } from '@/features/dashboard/types';
import { HoursBarChart } from '@/shared/charts/HoursBarChart';

interface HoursOverviewCardProps {
  period: DashboardPeriod;
  data: DayHours[];
}

/** Affiche les heures réelles par mode avec un libellé adapté à la période choisie. */
export function HoursOverviewCard({ period, data }: HoursOverviewCardProps) {
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
          data={data}
          target={period === 'week' ? 7 : 35}
          targetLabel={period === 'week' ? '7 h' : '35 h'}
        />
      </Card.Content>
    </Card>
  );
}
