import { ArrowDownToLine, PersonPlus } from '@gravity-ui/icons';
import { Button, Tabs } from '@heroui/react';
import { sileo } from 'sileo';
import type { DashboardPeriod } from '@/features/dashboard/types';

interface DashboardToolbarProps {
  period: DashboardPeriod;
  onPeriodChange: (period: DashboardPeriod) => void;
  onCreateEmployee: () => void;
}

export function DashboardToolbar({
  period,
  onPeriodChange,
  onCreateEmployee,
}: DashboardToolbarProps) {
  return (
    <div className='flex flex-wrap items-center gap-2'>
      <Tabs
        selectedKey={period}
        onSelectionChange={(key) =>
          onPeriodChange(String(key) as DashboardPeriod)
        }
      >
        <Tabs.ListContainer>
          <Tabs.List aria-label='Période'>
            <Tabs.Tab id='week'>
              Semaine
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id='month'>
              <Tabs.Separator />
              Mois
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>
      </Tabs>

      <div className='ms-auto flex flex-wrap items-center gap-2'>
        <Button
          variant='secondary'
          onPress={() =>
            sileo.success({
              title: 'Export généré',
              description: 'Le rapport CSV a été téléchargé.',
            })
          }
        >
          <ArrowDownToLine />
          Exporter
        </Button>
        <Button onPress={onCreateEmployee}>
          <PersonPlus />
          Créer un employé
        </Button>
      </div>
    </div>
  );
}
