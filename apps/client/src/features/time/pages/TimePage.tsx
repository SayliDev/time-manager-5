import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clockIn, clockOut } from '@/shared/api/client';
import {
  ArrowDownToLine,
  Calendar,
  Clock,
  TriangleExclamation,
} from '@gravity-ui/icons';
import {
  Button,
  Card,
  Chip,
  DateField,
  DateRangePicker,
  Label,
  ListBox,
  RangeCalendar,
  Select,
  Skeleton,
  Table,
  Tabs,
} from '@heroui/react';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTimekeeping } from '@/features/time/hooks/useTimekeeping';
import { EntriesTable } from '@/features/time/components/EntriesTable';
import { ChartSkeleton } from '@/shared/charts/ChartSkeleton';
import { HoursBarChart } from '@/shared/charts/HoursBarChart';
import { formatDecimal, formatHours } from '@/shared/lib/format';
import { PageHeader } from '@/shared/ui/PageHeader';
import { SkeletonSwap } from '@/shared/ui/SkeletonSwap';
import { StatCard, StatCardSkeleton } from '@/shared/ui/StatCard';

const fullName = (u: { firstName: string; lastName: string }) => `${u.firstName} ${u.lastName}`;

const statsGridClassName =
  'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 3xl:gap-5 4xl:gap-6';

interface WeeklySummaryRow {
  id: string;
  label: string;
  range: string;
  hours: number;
  days: number;
}

export function TimePage() {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<'onsite' | 'remote'>('onsite');
  const clock = useMutation({
    mutationFn: (action: 'in' | 'out') => action === 'in' ? clockIn(mode) : clockOut(),
    onSuccess: () => queryClient.invalidateQueries(),
  });
  const [tab, setTab] = useState('daily');
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get('user_id') ?? '';
  const setSelectedId = (id: string) => setSearchParams({ user_id: id });
  const [range, setRange] = useState<{ start: string; end: string } | null>(null);
  const query = useTimekeeping(selectedId, range?.start, range?.end);
  const users = query.users;
  const usersLoading = query.isPending;
  const entriesQuery = query;
  const hoursQuery = query;
  const weeklyQuery = query;
  const entries = query.data?.entries ?? [];
  const weeklyRows = query.data?.weekly ?? [];
  const stats = query.data?.stats;
  const exportCsv = () => {
    const rows = [['Date', 'Arrivée', 'Départ', 'Heures', 'Lieu', 'Statut'],
      ...entries.map(e => [e.date, e.arrival ?? '', e.departure ?? '', e.hours === null ? '' : String(e.hours), e.mode, e.status])];
    const csv = rows.map(row => row.map(value => '"' + value.replaceAll('"', '""') + '"').join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `pointages-${selectedId || query.data?.selectedId || 'employe'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };
  // Au changement d'employé, on garde l'ancien contenu atténué plutôt que de
  // repasser par le skeleton : le rendu reste stable.
  const dimmed = (isPlaceholderData: boolean) =>
    `transition-opacity duration-300 ${isPlaceholderData ? 'opacity-50' : 'opacity-100'}`;

  const person = users.find((u) => u.id === (selectedId || query.data?.selectedId));
  const total = stats?.total ?? 0;
  const lateCount = stats?.lateCount ?? 0;
  const missing = stats?.missingCount ?? 0;
  const anomalies = lateCount + missing;

  if (query.isError) return <p role='alert'>{query.error?.message}</p>;

  if (!query.isPending && users.length === 0) return <p role='status'>Aucun employé accessible.</p>;

  return (
    <>
      <div className='mb-4 flex items-center gap-3'>
        <label>Lieu <select aria-label='Lieu de travail' value={mode} onChange={e => setMode(e.target.value as 'onsite' | 'remote')}><option value='onsite'>Présentiel</option><option value='remote'>Télétravail</option></select></label>
        <Button isDisabled={clock.isPending} onPress={() => clock.mutate('in')}>Pointer mon arrivée</Button>
        <Button isDisabled={clock.isPending} onPress={() => clock.mutate('out')}>Pointer mon départ</Button>
        {clock.isError && <p role='alert'>{clock.error.message}</p>}
      </div>
      <PageHeader
        actions={
          <Button
            variant='secondary'
            isDisabled={!query.data || query.isPlaceholderData}
            onPress={exportCsv}
          >
            <ArrowDownToLine />
            Exporter
          </Button>
        }
        description='Consultez le détail des arrivées, départs et heures travaillées de vos collaborateurs.'
        title='Pointages'
      />

      <Card>
        <Card.Content className='flex flex-col gap-4 md:flex-row md:items-end'>
          <Select
            className='w-full md:w-64'
            fullWidth
            isDisabled={usersLoading}
            value={query.selectedId}
            variant='secondary'
            onChange={(key) => setSelectedId(String(key))}
          >
            <Label>Employé</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {users.map((u) => (
                  <ListBox.Item id={u.id} key={u.id} textValue={fullName(u)}>
                    {fullName(u)}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>

          <DateRangePicker
            className='w-full md:w-80'
            endName='to'
            startName='from'
            onChange={(value) => setRange(value ? { start: value.start.toString(), end: value.end.toString() } : null)}
          >
            <Label>Période</Label>
            <DateField.Group fullWidth variant='secondary'>
              <DateField.Input slot='start'>
                {(segment) => <DateField.Segment segment={segment} />}
              </DateField.Input>
              <DateRangePicker.RangeSeparator />
              <DateField.Input slot='end'>
                {(segment) => <DateField.Segment segment={segment} />}
              </DateField.Input>
              <DateField.Suffix>
                <DateRangePicker.Trigger>
                  <DateRangePicker.TriggerIndicator />
                </DateRangePicker.Trigger>
              </DateField.Suffix>
            </DateField.Group>
            <DateRangePicker.Popover>
              <RangeCalendar aria-label='Choisir une période'>
                <RangeCalendar.Header>
                  <RangeCalendar.YearPickerTrigger>
                    <RangeCalendar.YearPickerTriggerHeading />
                    <RangeCalendar.YearPickerTriggerIndicator />
                  </RangeCalendar.YearPickerTrigger>
                  <RangeCalendar.NavButton slot='previous' />
                  <RangeCalendar.NavButton slot='next' />
                </RangeCalendar.Header>
                <RangeCalendar.Grid>
                  <RangeCalendar.GridHeader>
                    {(day) => (
                      <RangeCalendar.HeaderCell>{day}</RangeCalendar.HeaderCell>
                    )}
                  </RangeCalendar.GridHeader>
                  <RangeCalendar.GridBody>
                    {(date) => <RangeCalendar.Cell date={date} />}
                  </RangeCalendar.GridBody>
                </RangeCalendar.Grid>
                <RangeCalendar.YearPickerGrid>
                  <RangeCalendar.YearPickerGridBody>
                    {({ year }) => <RangeCalendar.YearPickerCell year={year} />}
                  </RangeCalendar.YearPickerGridBody>
                </RangeCalendar.YearPickerGrid>
              </RangeCalendar>
            </DateRangePicker.Popover>
          </DateRangePicker>

          <div className='flex-1' />
          <SkeletonSwap
            isLoading={!person}
            skeleton={<Skeleton className='h-5 w-28 rounded-2xl' />}
          >
            {person ? (
              <Chip color='accent' size='sm' variant='soft'>
                <Chip.Label>{fullName(person)}</Chip.Label>
              </Chip>
            ) : null}
          </SkeletonSwap>
        </Card.Content>
      </Card>

      <section
        aria-label='Résumé de la période'
        className={dimmed(entriesQuery.isPlaceholderData)}
      >
        <SkeletonSwap
          isLoading={entriesQuery.isPending}
          skeleton={
            <div className={statsGridClassName}>
              <StatCardSkeleton />
              <StatCardSkeleton withDelta />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </div>
          }
        >
          <div className={statsGridClassName}>
            <StatCard
              hint={`sur ${stats?.days ?? 0} jours travaillés`}
              icon={Clock}
              label='Total travaillé'
              tone='accent'
              value={formatHours(total)}
            />
            <StatCard
              delta={stats?.averageWeeklyHoursDelta}
              hint='vs objectif contractuel'
              icon={Calendar}
              label='Moyenne / semaine'
              tone='success'
              unit='h'
              value={formatDecimal(stats?.averageWeeklyHours ?? 0)}
            />
            <StatCard
              icon={Clock}
              label='Au-delà de 35 h'
              tone='warning'
              unit='h'
              value={formatDecimal(stats?.aboveTargetHours ?? 0)}
            />
            <StatCard
              hint='retards + oublis'
              icon={TriangleExclamation}
              label='Anomalies'
              tone={anomalies > 0 ? 'danger' : 'success'}
              value={String(anomalies)}
            />
          </div>
        </SkeletonSwap>
      </section>

      <Card>
        <Tabs
          selectedKey={tab}
          onSelectionChange={(key) => setTab(String(key))}
        >
          <Card.Header className='flex-row flex-wrap items-center justify-between gap-3'>
            <div>
              <Card.Title>Détail des heures</Card.Title>
              <Card.Description>
                Présentiel vs télétravail · vue quotidienne ou hebdomadaire
              </Card.Description>
            </div>
            <Tabs.ListContainer>
              <Tabs.List aria-label='Type de vue'>
                <Tabs.Tab id='daily'>
                  Quotidien
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id='weekly'>
                  <Tabs.Separator />
                  Hebdomadaire
                  <Tabs.Indicator />
                </Tabs.Tab>
              </Tabs.List>
            </Tabs.ListContainer>
          </Card.Header>

          <Card.Content>
            <Tabs.Panel className='flex flex-col gap-6' id='daily'>
              <SkeletonSwap
                isLoading={hoursQuery.isPending}
                skeleton={<ChartSkeleton grouped height={200} />}
              >
                <div className={dimmed(hoursQuery.isPlaceholderData)}>
                  <HoursBarChart
                    compareModes
                    data={hoursQuery.data?.hours ?? []}
                    height={200}
                  />
                </div>
              </SkeletonSwap>
              <div className={dimmed(entriesQuery.isPlaceholderData)}>
                <EntriesTable
                  entries={entries}
                  isLoading={entriesQuery.isPending}
                />
              </div>
            </Tabs.Panel>

            <Tabs.Panel
              className={dimmed(weeklyQuery.isPlaceholderData)}
              id='weekly'
            >
              <WeeklySummaryTable
                isLoading={weeklyQuery.isPending}
                rows={weeklyRows}
              />
            </Tabs.Panel>
          </Card.Content>
        </Tabs>
      </Card>
    </>
  );
}

interface WeeklySummaryTableProps {
  rows: readonly WeeklySummaryRow[];
  isLoading: boolean;
}

function WeeklySummaryTable({ rows, isLoading }: WeeklySummaryTableProps) {
  const renderTable = (loading: boolean) => (
    <Table>
      <Table.ScrollContainer>
        <Table.Content
          aria-label='Heures par semaine'
          className='min-w-[560px]'
        >
          <Table.Header>
            <Table.Column isRowHeader>Semaine</Table.Column>
            <Table.Column>Jours travaillés</Table.Column>
            <Table.Column>Total</Table.Column>
          </Table.Header>
          <Table.Body>
            {loading
              ? Array.from({ length: 4 }, (_, i) => (
                  <Table.Row id={`skeleton-${i}`} key={`skeleton-${i}`}>
                    <Table.Cell>
                      <div className='flex flex-col gap-1.5'>
                        <Skeleton className='h-3.5 w-24 rounded-md' />
                        <Skeleton className='h-3 w-28 rounded-md' />
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <Skeleton className='h-3.5 w-10 rounded-md' />
                    </Table.Cell>
                    <Table.Cell>
                      <Skeleton className='h-3.5 w-14 rounded-md' />
                    </Table.Cell>
                  </Table.Row>
                ))
              : rows.map((row) => {
                  return (
                    <Table.Row id={row.id} key={row.id}>
                      <Table.Cell>
                        <p className='text-sm font-medium'>{row.label}</p>
                        <p className='text-xs text-muted'>{row.range}</p>
                      </Table.Cell>
                      <Table.Cell>
                        <span className='tabular text-sm'>{row.days} / 5</span>
                      </Table.Cell>
                      <Table.Cell>
                        <span className='tabular text-sm font-medium'>
                          {formatHours(row.hours)}
                        </span>
                      </Table.Cell>
                    </Table.Row>
                  );
                })}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );

  return (
    <SkeletonSwap isLoading={isLoading} skeleton={renderTable(true)}>
      {renderTable(false)}
    </SkeletonSwap>
  );
}
