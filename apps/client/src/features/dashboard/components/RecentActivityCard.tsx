import { Card } from '@heroui/react';
import { activity, fullName, getUser } from '@/data/mock';
import { UserAvatar } from '@/shared/ui/UserAvatar';

export function RecentActivityCard() {
  return (
    <Card>
      <Card.Header>
        <Card.Title>Activité récente</Card.Title>
        <Card.Description>Derniers pointages et alertes</Card.Description>
      </Card.Header>
      <Card.Content>
        <ol className='flex flex-col gap-4'>
          {activity.map((item) => {
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
      </Card.Content>
    </Card>
  );
}
