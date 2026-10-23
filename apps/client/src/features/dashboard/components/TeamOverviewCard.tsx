import { Card, Link } from '@heroui/react';
import { EmployeesTable } from '@/features/users/components/EmployeesTable';
import { appPath } from '@/features/widgets/layout/nav';
import type { User } from '@/features/users/types';

interface TeamOverviewCardProps {
  users: User[];
  onView: (user: User) => void;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  isLoading?: boolean;
}

export function TeamOverviewCard({
  users,
  onView,
  onEdit,
  onDelete,
  isLoading = false,
}: TeamOverviewCardProps) {
  return (
    <Card className='lg:col-span-2'>
      <Card.Header className='flex-row items-start justify-between gap-3'>
        <div>
          <Card.Title>Collaborateurs</Card.Title>
          <Card.Description>
            Cliquez sur un collaborateur pour ouvrir sa fiche.
          </Card.Description>
        </div>
        <Link href={appPath('/users')}>
          Tout voir
          <Link.Icon />
        </Link>
      </Card.Header>
      <Card.Content>
        <EmployeesTable
          compact
          showRole
          ariaLabel='Collaborateurs'
          isLoading={isLoading}
          skeletonRows={6}
          users={users.slice(0, 6)}
          onDelete={onDelete}
          onEdit={onEdit}
          onView={onView}
        />
      </Card.Content>
    </Card>
  );
}
