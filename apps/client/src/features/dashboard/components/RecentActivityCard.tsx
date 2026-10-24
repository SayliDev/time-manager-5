import { Card } from '@heroui/react';
import { fullName } from '@/features/users/lib/names';
import type { ActivityItem } from '@/features/dashboard/types';
import type { User } from '@/features/users/types';
import { UserAvatar } from '@/shared/ui/UserAvatar';

interface RecentActivityCardProps {
  activity: ActivityItem[];
  users: User[];
}

export function RecentActivityCard({ activity, users }: RecentActivityCardProps) {
  return (
    <Card>
      <Card.Header>
        <Card.Title>Activité récente</Card.Title>
        <Card.Description>Derniers pointages et alertes</Card.Description>
      </Card.Header>
      <Card.Content>
        <ol className='flex flex-col gap-4'>
          {activity.map((item) => {
            const user = users.find((user) => user.id === item.userId);
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
      </Card.Content>
    </Card>
  );
}
