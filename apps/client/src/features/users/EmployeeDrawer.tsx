import { Briefcase, Envelope, Handset, Pencil } from '@gravity-ui/icons';
import {
  Button,
  Drawer,
  Separator,
  Skeleton,
} from '@heroui/react';
import { useNavigate } from 'react-router-dom';
import { fullName } from '@/shared/lib/user';
import { useTeams } from '@/features/teams/hooks/useTeams';
import { useTimeEntries, useUserHours, useTimeSummary } from '@/features/time/hooks/useTimekeeping';
import type { User } from '@/features/users/types';
import { ChartSkeleton } from '@/shared/charts/ChartSkeleton';
import { HoursBarChart } from '@/shared/charts/HoursBarChart';
import {
  EntryStatusChip,
  PresenceChip,
  RoleChip,
} from '@/shared/ui/StatusChips';
import { UserAvatar } from '@/shared/ui/UserAvatar';
import { SkeletonSwap } from '@/shared/ui/SkeletonSwap';
import { formatDecimal, currentWeekRange } from '@/shared/lib/format';

interface EmployeeDrawerProps {
  user: User | null;
  onOpenChange: (open: boolean) => void;
  onEdit?: (user: User) => void;
}


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
  const { data: teams = [] } = useTeams();
  const getTeam = (id: string | null | undefined) => teams.find(t => t.id === id);
  const team = getTeam(user?.teamId);
  const hours = useUserHours(user?.id);
  const entries = useTimeEntries(user?.id);
  const hoursLoading = hours.isPending || hours.isPlaceholderData;
  const entriesLoading = entries.isPending || entries.isPlaceholderData;
  const summary = useTimeSummary(user?.id, currentWeekRange());
  const overtime = summary.data?.overtime_hours ?? 0;

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
                  <p className='flex items-baseline justify-between'>
                    <span>Cette semaine</span>
                    <strong>{formatDecimal(user.weeklyHours)} h</strong>
                  </p>
                  {summary.isError && <p role='alert'>{summary.error.message}</p>}
                  {overtime > 0 ? (
                    <p className='text-xs text-warning'>
                      +{formatDecimal(overtime)} h au-dessus de l’objectif
                    </p>
                  ) : null}
                  {hours.isError && <p role='alert'>{hours.error.message}</p>}
                  <SkeletonSwap
                    isLoading={hoursLoading}
                    skeleton={<ChartSkeleton height={170} />}
                  >
                    <HoursBarChart
                      data={hours.data ?? []}
                      height={170}
                    />
                  </SkeletonSwap>
                </section>

                <Separator />

                <section
                  aria-label='Derniers pointages'
                  className='flex flex-col gap-1'
                >
                  <h3 className='mb-1 text-sm font-semibold'>
                    Derniers pointages
                  </h3>
                  {entries.isError && <p role='alert'>{entries.error.message}</p>}
                  <SkeletonSwap
                    isLoading={entriesLoading}
                    skeleton={
                      <ul className='flex flex-col divide-y divide-separator'>
                        {Array.from({ length: 4 }, (_, i) => (
                          <li
                            className='flex items-center justify-between gap-3 py-2.5'
                            key={i}
                          >
                            <div className='flex flex-col gap-1.5 py-0.5'>
                              <Skeleton className='h-3.5 w-24 rounded-md' />
                              <Skeleton className='h-3 w-20 rounded-md' />
                            </div>
                            <div className='flex items-center gap-3'>
                              <Skeleton className='h-3.5 w-10 rounded-md' />
                              <Skeleton className='h-5 w-16 rounded-2xl' />
                            </div>
                          </li>
                        ))}
                      </ul>
                    }
                  >
                    <ul className='flex flex-col divide-y divide-separator'>
                      {(entries.data ?? []).slice(0, 4).map((entry) => (
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
                              {entry.hours === null ? '\u2014' : `${formatDecimal(entry.hours)} h`}
                            </span>
                            <EntryStatusChip status={entry.status} />
                          </div>
                        </li>
                      ))}
                    </ul>
                  </SkeletonSwap>
                </section>
              </Drawer.Body>

              <Drawer.Footer>
                <Button
                  variant='tertiary'
                  onPress={() => {
                    onOpenChange(false);
                    navigate(`/dashboard/time?user_id=${encodeURIComponent(user.id)}`);
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
