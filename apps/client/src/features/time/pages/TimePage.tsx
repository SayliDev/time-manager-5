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
  toast,
} from '@heroui/react';
import { useState } from 'react';
import {
  useTimeEntries,
  useUserHours,
  useWeeklySummary,
} from '@/data/mockQueries';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { useUsers } from '@/features/users/hooks/useUsers';
import { fullName, isManagerRole } from '@/features/users/lib/names';
import { EntriesTable } from '@/features/time/components/EntriesTable';
import { WEEKLY_TARGET_HOURS } from '@/features/time/constants/weeklyRows';
import { ChartSkeleton } from '@/shared/charts/ChartSkeleton';
import { HoursBarChart } from '@/shared/charts/HoursBarChart';
import { formatDecimal, formatHours } from '@/shared/lib/format';
import { DemoBadge } from '@/shared/ui/DemoBadge';
import { PageHeader } from '@/shared/ui/PageHeader';
import { SkeletonSwap } from '@/shared/ui/SkeletonSwap';
import { StatCard, StatCardSkeleton } from '@/shared/ui/StatCard';

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
  const [tab, setTab] = useState('daily');
  const [pickedId, setPickedId] = useState<string | null>(null);

  const { data: currentUser } = useCurrentUser();
  const { data: users = [], isPending: usersLoading } = useUsers();
  // Un employé ne consulte que ses propres pointages.
  const canPickEmployee = currentUser ? isManagerRole(currentUser.role) : false;
  const selectedId = (canPickEmployee ? pickedId : null) ?? currentUser?.id;
  const entriesQuery = useTimeEntries(selectedId);
  const hoursQuery = useUserHours(selectedId);
  const weeklyQuery = useWeeklySummary(selectedId);

  const entries = entriesQuery.data ?? [];
  const weeklyRows = weeklyQuery.data ?? [];
  const dimmed = (isPlaceholderData: boolean) =>
    `transition-opacity duration-300 ${isPlaceholderData ? 'opacity-50' : 'opacity-100'}`;

  const person = users.find((u) => u.id === selectedId);
  const total = entries.reduce((sum, e) => sum + e.hours, 0);
  const lateCount = entries.filter((e) => e.status === 'late').length;
  const missing = entries.filter((e) => e.status === 'missing').length;
  const anomalies = lateCount + missing;

  return (
    <>
      <PageHeader
        actions={
          <Button
            variant='secondary'
            onPress={() =>
              toast.success('Export généré', {
                description: 'Votre relevé d’heures a été téléchargé.',
              })
            }
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
            isDisabled={usersLoading || !canPickEmployee}
            value={selectedId ?? null}
            variant='secondary'
            onChange={(key) => setPickedId(String(key))}
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
              badge={<DemoBadge />}
              hint='sur 8 jours'
              icon={Clock}
              label='Total travaillé'
              tone='accent'
              value={formatHours(total)}
            />
            <StatCard
              badge={<DemoBadge />}
              delta={4.1}
              hint='vs objectif'
              icon={Calendar}
              label='Moyenne / semaine'
              tone='success'
              unit='h'
              value={formatDecimal((total / 8) * 5)}
            />
            <StatCard
              badge={<DemoBadge />}
              hint={`objectif ${WEEKLY_TARGET_HOURS} h`}
              icon={Clock}
              label='Heures sup.'
              tone='warning'
              unit='h'
              value='3,2'
            />
            <StatCard
              badge={<DemoBadge />}
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
              <div className='flex items-center gap-2'>
                <Card.Title>Détail des heures</Card.Title>
                <DemoBadge />
              </div>
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
                    data={hoursQuery.data ?? []}
                    height={200}
                    target={7}
                    targetLabel='7 h'
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
            <Table.Column>Écart vs {WEEKLY_TARGET_HOURS} h</Table.Column>
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
                    <Table.Cell>
                      <Skeleton className='h-5 w-16 rounded-2xl' />
                    </Table.Cell>
                  </Table.Row>
                ))
              : rows.map((row) => {
                  const diff = row.hours - WEEKLY_TARGET_HOURS;
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
                      <Table.Cell>
                        <Chip
                          color={diff >= 0 ? 'success' : 'warning'}
                          size='sm'
                          variant='soft'
                        >
                          <Chip.Label className='tabular'>
                            {diff >= 0 ? '+' : ''}
                            {formatDecimal(diff)} h
                          </Chip.Label>
                        </Chip>
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
