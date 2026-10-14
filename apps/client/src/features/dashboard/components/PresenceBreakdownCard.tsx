import { Card, Label, ProgressBar } from '@heroui/react';
import { presenceBars } from '@/features/dashboard/constants/presenceBars';
import type { PresenceStatus, User } from '@/features/users/types';

interface PresenceBreakdownCardProps {
  users: User[];
}

export function PresenceBreakdownCard({ users }: PresenceBreakdownCardProps) {
  const countBy = (status: PresenceStatus) =>
    users.filter((u) => u.presence === status).length;

  return (
    <Card>
      <Card.Header>
        <Card.Title>Répartition du jour</Card.Title>
        <Card.Description>Statut de présence de l’équipe</Card.Description>
      </Card.Header>
      <Card.Content className='flex flex-col gap-5'>
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
      </Card.Content>
    </Card>
  );
}
