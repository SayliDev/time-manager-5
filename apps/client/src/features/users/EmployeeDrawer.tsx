import { Briefcase, Envelope, Handset, Pencil } from '@gravity-ui/icons';
import {
  Button,
  Drawer,
  Label,
  ProgressBar,
  Separator,
  Skeleton,
} from '@heroui/react';
import { useNavigate } from 'react-router-dom';
import { appPath } from '@/features/widgets/layout/nav';
import { getTeam } from '@/data/mock';
import { useTimeEntries, useUserHours } from '@/data/mockQueries';
import { fullName } from '@/features/users/lib/names';
import type { User } from '@/features/users/types';
import { ChartSkeleton } from '@/shared/charts/ChartSkeleton';
import { HoursBarChart } from '@/shared/charts/HoursBarChart';
import {
  EntryStatusChip,
  PresenceChip,
  RoleChip,
} from '@/shared/ui/StatusChips';
import { UserAvatar } from '@/shared/ui/UserAvatar';
import { DemoBadge } from '@/shared/ui/DemoBadge';
import { SkeletonSwap } from '@/shared/ui/SkeletonSwap';
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
  const hours = useUserHours(user?.id);
  const entries = useTimeEntries(user?.id);
  const hoursLoading = hours.isPending || hours.isPlaceholderData;
  const entriesLoading = entries.isPending || entries.isPlaceholderData;
  const weeklyHours = user?.weeklyHours ?? null;
  const progress =
    weeklyHours === null
      ? 0
      : Math.min(100, (weeklyHours / WEEKLY_TARGET) * 100);
  const overtime =
    weeklyHours === null ? 0 : Math.max(0, weeklyHours - WEEKLY_TARGET);

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
                      {user.presence ? (
                        <PresenceChip status={user.presence} />
                      ) : null}
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
                    <span className='text-foreground'>
                      {user.phone ?? 'Non renseigné'}
                    </span>
                  </p>
                  {team ? (
                    <p className='flex items-center gap-2.5 text-muted'>
                      <Briefcase className='size-4 shrink-0' />
                      <span className='text-foreground'>{team.name}</span>
                    </p>
                  ) : null}
                </section>

                <Separator />

                <section
                  aria-label='Heures de la semaine'
                  className='flex flex-col gap-3'
                >
                  <div className='flex items-center justify-between gap-2'>
                    <h3 className='text-sm font-semibold'>
                      Heures de la semaine
                    </h3>
                    <DemoBadge />
                  </div>
                  {weeklyHours !== null ? (
                    <ProgressBar
                      aria-label='Heures de la semaine'
                      color={overtime > 0 ? 'warning' : 'accent'}
                      value={progress}
                    >
                      <div className='flex items-baseline justify-between'>
                        <Label>Cette semaine</Label>
                        <span className='tabular text-sm text-muted'>
                          <strong className='text-base font-semibold text-foreground'>
                            {formatDecimal(weeklyHours)} h
                          </strong>{' '}
                          / {WEEKLY_TARGET} h
                        </span>
                      </div>
                      <ProgressBar.Track>
                        <ProgressBar.Fill />
                      </ProgressBar.Track>
                    </ProgressBar>
                  ) : null}
                  {overtime > 0 ? (
                    <p className='text-xs text-warning'>
                      +{formatDecimal(overtime)} h au-dessus de l’objectif
                    </p>
                  ) : null}
                  <SkeletonSwap
                    isLoading={hoursLoading}
                    skeleton={<ChartSkeleton height={170} />}
                  >
                    <HoursBarChart
                      data={hours.data ?? []}
                      height={170}
                      target={7}
                    />
                  </SkeletonSwap>
                </section>

                <Separator />

                <section
                  aria-label='Derniers pointages'
                  className='flex flex-col gap-1'
                >
                  <div className='mb-1 flex items-center justify-between gap-2'>
                    <h3 className='text-sm font-semibold'>
                      Derniers pointages
                    </h3>
                    <DemoBadge />
                  </div>
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
                              {formatDecimal(entry.hours)} h
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
                    navigate(appPath('/time'));
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
