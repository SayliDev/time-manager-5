import { Card, Skeleton } from '@heroui/react';
import { getUser } from '@/data/mock';
import { useActivity } from '@/data/mockQueries';
import { fullName } from '@/features/users/lib/names';
import { DemoBadge } from '@/shared/ui/DemoBadge';
import { SkeletonSwap } from '@/shared/ui/SkeletonSwap';
import { UserAvatar } from '@/shared/ui/UserAvatar';

const LINE_WIDTHS = ['w-4/5', 'w-3/5', 'w-11/12', 'w-2/3', 'w-3/4', 'w-1/2'];

export function RecentActivityCard() {
  const { data: activity, isPending } = useActivity();

  return (
    <Card>
      <Card.Header>
        <div className='flex items-center justify-between gap-2'>
          <Card.Title>Activité récente</Card.Title>
          <DemoBadge />
        </div>
        <Card.Description>Derniers pointages et alertes</Card.Description>
      </Card.Header>
      <Card.Content>
        <SkeletonSwap
          isLoading={isPending}
          skeleton={
            <ol className='flex flex-col gap-4'>
              {LINE_WIDTHS.map((width, i) => (
                <li className='flex items-start gap-3' key={i}>
                  <Skeleton className='size-8 shrink-0 rounded-2xl' />
                  <div className='flex min-w-0 flex-1 flex-col gap-2 pt-1'>
                    <Skeleton className={`h-3.5 rounded-md ${width}`} />
                    <Skeleton className='h-3 w-12 rounded-md' />
                  </div>
                </li>
              ))}
            </ol>
          }
        >
          <ol className='flex flex-col gap-4'>
            {activity?.map((item) => {
              const user = getUser(item.userId);
              if (!user) return null;
              const tone =
                item.type === 'alert'
                  ? 'text-warning'
                  : item.type === 'departure'
                    ? 'text-muted'
                    : 'text-success';
              return (
                <li className='flex items-start gap-3' key={item.id}>
                  <UserAvatar size='sm' user={user} />
                  <div className='min-w-0 flex-1'>
                    <p className='text-sm'>
                      <span className='font-medium'>{fullName(user)}</span>{' '}
                      <span className='text-muted'>{item.label}</span>
                    </p>
                    <p className={`tabular mt-0.5 text-xs ${tone}`}>
                      {item.time}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </SkeletonSwap>
      </Card.Content>
    </Card>
  );
}
