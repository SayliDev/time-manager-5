import { Table } from '@heroui/react';
import type { TimeEntry } from '@/features/time/types';
import { formatDay, formatHours } from '@/shared/lib/format';
import { EntryStatusChip, WorkModeChip } from '@/shared/ui/StatusChips';

interface EntriesTableProps {
  entries: TimeEntry[];
  ariaLabel?: string;
}

export function EntriesTable({
  entries,
  ariaLabel = 'Historique des pointages',
}: EntriesTableProps) {
  return (
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
            {entries.map((entry) => (
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
                    {entry.hours > 0 ? formatHours(entry.hours) : '—'}
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
}
