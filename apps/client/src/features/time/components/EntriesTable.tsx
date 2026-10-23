import { Skeleton, Table } from '@heroui/react';
import type { TimeEntry } from '@/features/time/types';
import { formatDay, formatHours } from '@/shared/lib/format';
import { SkeletonSwap } from '@/shared/ui/SkeletonSwap';
import { EntryStatusChip, WorkModeChip } from '@/shared/ui/StatusChips';

const DAY_WIDTHS = ['w-24', 'w-28', 'w-20', 'w-28', 'w-24', 'w-20'];

interface EntriesTableProps {
  entries: TimeEntry[];
  ariaLabel?: string;
  isLoading?: boolean;
  skeletonRows?: number;
}

export function EntriesTable({
  entries,
  ariaLabel = 'Historique des pointages',
  isLoading = false,
  skeletonRows = 6,
}: EntriesTableProps) {
  const renderTable = (loading: boolean) => (
    <Table>
      <Table.ScrollContainer>
        <Table.Content aria-label={ariaLabel} className='min-w-[660px]'>
          <Table.Header>
            <Table.Column isRowHeader>Jour</Table.Column>
            <Table.Column>Arrivée</Table.Column>
            <Table.Column>Départ</Table.Column>
            <Table.Column>Durée</Table.Column>
            <Table.Column>Lieu</Table.Column>
            <Table.Column>Statut</Table.Column>
          </Table.Header>
          <Table.Body>
            {loading
              ? Array.from({ length: skeletonRows }, (_, i) => (
                  <Table.Row id={`skeleton-${i}`} key={`skeleton-${i}`}>
                    <Table.Cell>
                      <Skeleton
                        className={`h-3.5 rounded-md ${DAY_WIDTHS[i % DAY_WIDTHS.length]}`}
                      />
                    </Table.Cell>
                    <Table.Cell>
                      <Skeleton className='h-3.5 w-10 rounded-md' />
                    </Table.Cell>
                    <Table.Cell>
                      <Skeleton className='h-3.5 w-10 rounded-md' />
                    </Table.Cell>
                    <Table.Cell>
                      <Skeleton className='h-3.5 w-14 rounded-md' />
                    </Table.Cell>
                    <Table.Cell>
                      <Skeleton className='h-5 w-24 rounded-2xl' />
                    </Table.Cell>
                    <Table.Cell>
                      <Skeleton className='h-5 w-20 rounded-2xl' />
                    </Table.Cell>
                  </Table.Row>
                ))
              : entries.map((entry) => (
                  <Table.Row id={entry.id} key={entry.id}>
                    <Table.Cell>
                      <span className='text-sm font-medium capitalize'>
                        {formatDay(entry.date)}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className='tabular text-sm'>
                        {entry.arrival ?? '—'}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className='tabular text-sm'>
                        {entry.departure ?? '—'}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className='tabular text-sm font-medium'>
                        {entry.hours !== null ? formatHours(entry.hours) : '—'}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <WorkModeChip mode={entry.mode} />
                    </Table.Cell>
                    <Table.Cell>
                      <EntryStatusChip status={entry.status} />
                    </Table.Cell>
                  </Table.Row>
                ))}
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
