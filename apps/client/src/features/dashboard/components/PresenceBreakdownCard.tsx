import { Card, Label, ProgressBar, Skeleton } from '@heroui/react';
import { presenceBars } from '@/features/dashboard/constants/presenceBars';
import type { PresenceStatus, User } from '@/features/users/types';
import { DemoBadge } from '@/shared/ui/DemoBadge';
import { SkeletonSwap } from '@/shared/ui/SkeletonSwap';

interface PresenceBreakdownCardProps {
  users: User[];
  isLoading?: boolean;
}

const LABEL_WIDTHS = ['w-16', 'w-20', 'w-18', 'w-14'];

export function PresenceBreakdownCard({
  users,
  isLoading = false,
}: PresenceBreakdownCardProps) {
  const countBy = (status: PresenceStatus) =>
    users.filter((u) => u.presence === status).length;

  return (
    <Card>
      <Card.Header>
        <div className='flex items-center justify-between gap-2'>
          <Card.Title>Répartition du jour</Card.Title>
          <DemoBadge />
        </div>
        <Card.Description>Statut de présence de l’équipe</Card.Description>
      </Card.Header>
      <Card.Content>
        <SkeletonSwap
          isLoading={isLoading}
          skeleton={
            <div className='flex flex-col gap-5'>
              {presenceBars.map(({ key }, i) => (
                <div className='flex flex-col gap-2' key={key}>
                  <div className='flex h-5 items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <Skeleton className='size-2 rounded-full' />
                      <Skeleton
                        className={`h-3.5 rounded-md ${LABEL_WIDTHS[i % LABEL_WIDTHS.length]}`}
                      />
                    </div>
                    <Skeleton className='h-3.5 w-10 rounded-md' />
                  </div>
                  <Skeleton className='h-2 w-full rounded-sm' />
                </div>
              ))}
            </div>
          }
        >
          <div className='flex flex-col gap-5'>
            {presenceBars.map(({ key, label, color, swatch }) => {
              const count = countBy(key);
              const pct = users.length ? (count / users.length) * 100 : 0;
              return (
                <ProgressBar
                  aria-label={label}
                  color={color}
                  key={key}
                  value={pct}
                >
                  <div className='flex items-center justify-between text-sm'>
                    <Label className='flex items-center gap-2'>
                      <span
                        aria-hidden
                        className={`size-2 shrink-0 rounded-full ${swatch}`}
                      />
                      {label}
                    </Label>
                    <span className='tabular font-medium'>
                      {count}
                      <span className='font-normal text-muted'>
                        {' '}
                        / {users.length}
                      </span>
                    </span>
                  </div>
                  <ProgressBar.Track>
                    <ProgressBar.Fill />
                  </ProgressBar.Track>
                </ProgressBar>
              );
            })}
          </div>
        </SkeletonSwap>
      </Card.Content>
    </Card>
  );
}
