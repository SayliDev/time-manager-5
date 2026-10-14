import { Briefcase, Envelope, Handset, Pencil } from '@gravity-ui/icons';
import { Button, Drawer, Label, ProgressBar, Separator } from '@heroui/react';
import { useNavigate } from 'react-router-dom';
import { fullName, getTeam, myEntries, weekHours } from '../../data/mock';
import type { User } from '@/features/users/types';
import { HoursBarChart } from '@/shared/charts/HoursBarChart';
import {
  EntryStatusChip,
  PresenceChip,
  RoleChip,
} from '@/shared/ui/StatusChips';
import { UserAvatar } from '@/shared/ui/UserAvatar';
import { formatDecimal } from '@/shared/lib/format';

interface EmployeeDrawerProps {
  user: User | null;
  onOpenChange: (open: boolean) => void;
  onEdit?: (user: User) => void;
}

const WEEKLY_TARGET = 35;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });

export function EmployeeDrawer({
  user,
  onOpenChange,
  onEdit,
}: EmployeeDrawerProps) {
  const navigate = useNavigate();
  const team = getTeam(user?.teamId);
  const progress = user
    ? Math.min(100, (user.weeklyHours / WEEKLY_TARGET) * 100)
    : 0;
  const overtime = user ? Math.max(0, user.weeklyHours - WEEKLY_TARGET) : 0;

  return (
    <Drawer.Backdrop
      isOpen={user !== null}
      variant='blur'
      onOpenChange={onOpenChange}
    >
      <Drawer.Content placement='right'>
        <Drawer.Dialog
          aria-label={user ? `Fiche de ${fullName(user)}` : 'Fiche employé'}
          className='w-full max-w-[460px]'
        >
          <Drawer.CloseTrigger />
          {user ? (
            <>
              <Drawer.Header className='gap-4'>
                <div className='flex items-center gap-4'>
                  <UserAvatar size='lg' user={user} />
                  <div className='min-w-0'>
                    <Drawer.Heading className='truncate'>
                      {fullName(user)}
                    </Drawer.Heading>
                    <div className='mt-1.5 flex flex-wrap items-center gap-2'>
                      <RoleChip role={user.role} />
                      <PresenceChip status={user.presence} />
                    </div>
                  </div>
                </div>
              </Drawer.Header>

              <Drawer.Body className='flex flex-col gap-6'>
                <section
                  aria-label='Coordonnées'
                  className='flex flex-col gap-2.5 text-sm'
                >
                  <p className='flex items-center gap-2.5 text-muted'>
                    <Envelope className='size-4 shrink-0' />
                    <span className='truncate text-foreground'>
                      {user.email}
                    </span>
                  </p>
                  <p className='flex items-center gap-2.5 text-muted'>
                    <Handset className='size-4 shrink-0' />
                    <span className='text-foreground'>{user.phone}</span>
                  </p>
                  <p className='flex items-center gap-2.5 text-muted'>
                    <Briefcase className='size-4 shrink-0' />
                    <span className='text-foreground'>
                      {team?.name ?? 'Sans équipe'}
                    </span>
                  </p>
                </section>

                <Separator />

                <section
                  aria-label='Heures de la semaine'
                  className='flex flex-col gap-3'
                >
                  <ProgressBar
                    aria-label='Heures de la semaine'
                    color={overtime > 0 ? 'warning' : 'accent'}
                    value={progress}
                  >
                    <div className='flex items-baseline justify-between'>
                      <Label>Cette semaine</Label>
                      <span className='tabular text-sm text-muted'>
                        <strong className='text-base font-semibold text-foreground'>
                          {formatDecimal(user.weeklyHours)} h
                        </strong>{' '}
                        / {WEEKLY_TARGET} h
                      </span>
                    </div>
                    <ProgressBar.Track>
                      <ProgressBar.Fill />
                    </ProgressBar.Track>
                  </ProgressBar>
                  {overtime > 0 ? (
                    <p className='text-xs text-warning'>
                      +{formatDecimal(overtime)} h au-dessus de l’objectif
                    </p>
                  ) : null}
                  <HoursBarChart data={weekHours} height={170} target={7} />
                </section>

                <Separator />

                <section
                  aria-label='Derniers pointages'
                  className='flex flex-col gap-1'
                >
                  <h3 className='mb-1 text-sm font-semibold'>
                    Derniers pointages
                  </h3>
                  <ul className='flex flex-col divide-y divide-separator'>
                    {myEntries.slice(0, 4).map((entry) => (
                      <li
                        className='flex items-center justify-between gap-3 py-2.5'
                        key={entry.id}
                      >
                        <div>
                          <p className='text-sm font-medium capitalize'>
                            {formatDate(entry.date)}
                          </p>
                          <p className='tabular text-xs text-muted'>
                            {entry.arrival ?? '—'} → {entry.departure ?? '—'}
                          </p>
                        </div>
                        <div className='flex items-center gap-3'>
                          <span className='tabular text-sm font-medium'>
                            {formatDecimal(entry.hours)} h
                          </span>
                          <EntryStatusChip status={entry.status} />
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              </Drawer.Body>

              <Drawer.Footer>
                <Button
                  variant='tertiary'
                  onPress={() => {
                    onOpenChange(false);
                    navigate('/mcp/time');
                  }}
                >
                  Voir tous les pointages
                </Button>
                {onEdit ? (
                  <Button onPress={() => onEdit(user)}>
                    <Pencil />
                    Modifier
                  </Button>
                ) : null}
              </Drawer.Footer>
            </>
          ) : null}
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  );
}
