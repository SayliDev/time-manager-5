import { EllipsisVertical, Eye, Pencil, TrashBin } from '@gravity-ui/icons';
import {
  Button,
  Dropdown,
  Kbd,
  Label,
  ProgressBar,
  Separator,
  Table,
  type SortDescriptor,
} from '@heroui/react';
import { useMemo, useState } from 'react';
import { fullName, getTeam } from '@/data/mock';
import type { User } from '@/features/users/types';
import { PresenceChip, RoleChip } from '@/shared/ui/StatusChips';
import { UserAvatar } from '@/shared/ui/UserAvatar';
import { formatDecimal } from '@/shared/lib/format';

const WEEKLY_TARGET = 35;

interface EmployeesTableProps {
  users: User[];
  onView: (user: User) => void;
  onEdit?: (user: User) => void;
  onDelete?: (user: User) => void;
  showRole?: boolean;
  compact?: boolean;
  ariaLabel?: string;
}

export function EmployeesTable({
  users,
  onView,
  onEdit,
  onDelete,
  showRole = false,
  compact = false,
  ariaLabel = 'Liste des employés',
}: EmployeesTableProps) {
  const [sort, setSort] = useState<SortDescriptor>({
    column: 'name',
    direction: 'ascending',
  });

  const sorted = useMemo(() => {
    const list = [...users];
    const compare = (a: User, b: User): number => {
      switch (sort.column) {
        case 'weeklyHours':
          return a.weeklyHours - b.weeklyHours;
        case 'presence':
          return a.presence.localeCompare(b.presence);
        case 'team':
          return (getTeam(a.teamId)?.name ?? '').localeCompare(
            getTeam(b.teamId)?.name ?? ''
          );
        default:
          return fullName(a).localeCompare(fullName(b));
      }
    };
    list.sort((a, b) =>
      sort.direction === 'descending' ? -compare(a, b) : compare(a, b)
    );
    return list;
  }, [users, sort]);

  const header =
    (label: string) =>
    ({ sortDirection }: { sortDirection?: 'ascending' | 'descending' }) =>
      (
        <Table.SortableColumnHeader sortDirection={sortDirection}>
          {label}
        </Table.SortableColumnHeader>
      );

  return (
    <Table>
      <Table.ScrollContainer>
        <Table.Content
          aria-label={ariaLabel}
          className={compact ? 'min-w-[520px]' : 'min-w-[860px]'}
          sortDescriptor={sort}
          onSortChange={setSort}
        >
          <Table.Header>
            <Table.Column allowsSorting isRowHeader id='name'>
              {header('Employé')}
            </Table.Column>
            {compact ? null : (
              <Table.Column allowsSorting id='team'>
                {header('Équipe')}
              </Table.Column>
            )}
            {showRole ? <Table.Column id='role'>Rôle</Table.Column> : null}
            <Table.Column allowsSorting id='presence'>
              {header('Statut')}
            </Table.Column>
            <Table.Column allowsSorting id='weeklyHours'>
              {header('Heures / sem.')}
            </Table.Column>
            {compact ? null : (
              <Table.Column id='lastClock'>Dernier pointage</Table.Column>
            )}
            <Table.Column id='actions'>
              <span className='sr-only'>Actions</span>
            </Table.Column>
          </Table.Header>

          <Table.Body renderEmptyState={() => <EmptyRows />}>
            {sorted.map((user) => {
              const pct = Math.min(
                100,
                (user.weeklyHours / WEEKLY_TARGET) * 100
              );
              const over = user.weeklyHours > WEEKLY_TARGET + 3;
              return (
                <Table.Row id={user.id} key={user.id}>
                  <Table.Cell>
                    <button
                      aria-label={`Ouvrir la fiche de ${fullName(user)}`}
                      className='flex min-w-0 items-center gap-3 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-focus'
                      type='button'
                      onClick={() => onView(user)}
                    >
                      <UserAvatar size='sm' user={user} />
                      <span className='min-w-0'>
                        <span className='block truncate text-sm font-medium text-foreground'>
                          {fullName(user)}
                        </span>
                        <span className='block truncate text-xs text-muted'>
                          {user.email}
                        </span>
                      </span>
                    </button>
                  </Table.Cell>
                  {compact ? null : (
                    <Table.Cell>
                      <span className='text-sm'>
                        {getTeam(user.teamId)?.name ?? '—'}
                      </span>
                    </Table.Cell>
                  )}
                  {showRole ? (
                    <Table.Cell>
                      <RoleChip role={user.role} />
                    </Table.Cell>
                  ) : null}
                  <Table.Cell>
                    <PresenceChip status={user.presence} />
                  </Table.Cell>
                  <Table.Cell>
                    <div className='flex items-center gap-3'>
                      <ProgressBar
                        aria-label={`Heures de ${fullName(user)}`}
                        className='w-16'
                        color={over ? 'warning' : 'accent'}
                        value={pct}
                      >
                        <ProgressBar.Track>
                          <ProgressBar.Fill />
                        </ProgressBar.Track>
                      </ProgressBar>
                      <span className='tabular text-sm font-medium whitespace-nowrap'>
                        {formatDecimal(user.weeklyHours)} h
                      </span>
                    </div>
                  </Table.Cell>
                  {compact ? null : (
                    <Table.Cell>
                      <span className='text-sm whitespace-nowrap text-muted'>
                        {user.lastClock}
                      </span>
                    </Table.Cell>
                  )}
                  <Table.Cell>
                    <Dropdown>
                      <Button
                        isIconOnly
                        aria-label={`Actions pour ${fullName(user)}`}
                        size='sm'
                        variant='ghost'
                      >
                        <EllipsisVertical />
                      </Button>
                      <Dropdown.Popover className='min-w-[220px]'>
                        <Dropdown.Menu
                          onAction={(key) => {
                            if (key === 'view') onView(user);
                            if (key === 'edit') onEdit?.(user);
                            if (key === 'delete') onDelete?.(user);
                          }}
                        >
                          <Dropdown.Item id='view' textValue='Voir la fiche'>
                            <Eye className='size-4 shrink-0 text-muted' />
                            <Label className='flex-1'>Voir la fiche</Label>
                            <Kbd variant='light'>
                              <Kbd.Content>V</Kbd.Content>
                            </Kbd>
                          </Dropdown.Item>
                          {onEdit ? (
                            <Dropdown.Item id='edit' textValue='Modifier'>
                              <Pencil className='size-4 shrink-0 text-muted' />
                              <Label className='flex-1'>Modifier</Label>
                              <Kbd variant='light'>
                                <Kbd.Content>E</Kbd.Content>
                              </Kbd>
                            </Dropdown.Item>
                          ) : null}
                          {onDelete ? (
                            <Dropdown.Item
                              id='delete'
                              textValue='Supprimer'
                              variant='danger'
                            >
                              <TrashBin className='size-4 shrink-0 text-danger' />
                              <Label className='flex-1'>Supprimer</Label>
                              <Kbd variant='light'>
                                <Kbd.Abbr keyValue='delete' />
                              </Kbd>
                            </Dropdown.Item>
                          ) : null}
                        </Dropdown.Menu>
                      </Dropdown.Popover>
                    </Dropdown>
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );
}

function EmptyRows() {
  return (
    <div className='flex flex-col items-center gap-2 py-12 text-center'>
      <Separator className='w-10' />
      <p className='text-sm font-medium'>Aucun employé trouvé</p>
      <p className='text-xs text-muted'>
        Essayez de modifier vos filtres ou votre recherche.
      </p>
    </div>
  );
}
