import { Avatar } from '@heroui/react';
import { fullName, initials } from '@/shared/lib/user';
import type { User } from '@/features/users/types';

const colors = ['accent', 'success', 'warning', 'danger', 'default'] as const;

interface UserAvatarProps {
  user: Pick<User, 'id' | 'firstName' | 'lastName'>;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function UserAvatar({ user, size = 'md', className }: UserAvatarProps) {
  const index = Number(user.id.replace(/\D/g, '')) % colors.length;
  return (
    <Avatar
      aria-label={fullName(user)}
      className={className}
      color={colors[index]}
      size={size}
    >
      <Avatar.Fallback>{initials(user)}</Avatar.Fallback>
    </Avatar>
  );
}

export function UserCell({
  user,
  subtitle,
}: {
  user: Pick<User, 'id' | 'firstName' | 'lastName' | 'email'>;
  subtitle?: string;
}) {
  return (
    <div className='flex min-w-0 items-center gap-3'>
      <UserAvatar size='sm' user={user} />
      <div className='min-w-0'>
        <p className='truncate text-sm font-medium text-foreground'>
          {fullName(user)}
        </p>
        <p className='truncate text-xs text-muted'>{subtitle ?? user.email}</p>
      </div>
    </div>
  );
}
