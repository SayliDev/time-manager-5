import { ArrowDownToLine, PersonPlus } from '@gravity-ui/icons';
import { Button, ListBox, Select, Tabs, toast } from '@heroui/react';
import type { DashboardPeriod } from '@/features/dashboard/types';


interface DashboardToolbarProps {
  teams: { id: string; name: string }[];
  teamId: string;
  period: DashboardPeriod;
  onTeamChange: (teamId: string) => void;
  onPeriodChange: (period: DashboardPeriod) => void;
  onCreateEmployee: () => void;
}

export function DashboardToolbar({
  teams,
  teamId,
  period,
  onTeamChange,
  onPeriodChange,
  onCreateEmployee,
}: DashboardToolbarProps) {

  return (
    <div className='flex flex-wrap items-center gap-2'>
      <Select
        aria-label='Filtrer par équipe'
        className='w-52'
        value={teamId}
        variant='secondary'
        onChange={(key) => onTeamChange(String(key))}
      >
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            <ListBox.Item id='all' textValue='Toutes les équipes'>
              Toutes les équipes
              <ListBox.ItemIndicator />
            </ListBox.Item>
            {teams.map((t) => (
              <ListBox.Item id={t.id} key={t.id} textValue={t.name}>
                {t.name}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>

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
            toast.success('Export généré', {
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
