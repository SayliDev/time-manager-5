import { Pulse } from '@gravity-ui/icons';
import { Chip } from '@heroui/react';
import { useState } from 'react';
import { useDemoPresence } from '@/data/mockQueries';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { DashboardKpis } from '@/features/dashboard/components/DashboardKpis';
import { DashboardToolbar } from '@/features/dashboard/components/DashboardToolbar';
import { HoursOverviewCard } from '@/features/dashboard/components/HoursOverviewCard';
import { PresenceBreakdownCard } from '@/features/dashboard/components/PresenceBreakdownCard';
import { RecentActivityCard } from '@/features/dashboard/components/RecentActivityCard';
import { TeamOverviewCard } from '@/features/dashboard/components/TeamOverviewCard';
import type { DashboardPeriod } from '@/features/dashboard/types';
import { EmployeeDrawer } from '@/features/users/EmployeeDrawer';
import { DeleteUserDialog } from '@/features/users/components/DeleteUserDialog';
import { UserFormModal } from '@/features/users/components/UserFormModal';
import { useUsers } from '@/features/users/hooks/useUsers';
import type { User } from '@/features/users/types';
import { PageHeader } from '@/shared/ui/PageHeader';

export function ManagerDashboardPage() {
  const [period, setPeriod] = useState<DashboardPeriod>('week');

  const [viewUser, setViewUser] = useState<User | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);

  const { data: currentUser } = useCurrentUser();
  const { data: users = [], isPending: usersLoading } = useUsers();
  const presence = useDemoPresence();

  const openCreate = () => {
    setEditUser(null);
    setFormOpen(true);
  };
  const openEdit = (user: User) => {
    setViewUser(null);
    setEditUser(user);
    setFormOpen(true);
  };

  return (
    <>
      <PageHeader
        description='Vue d’ensemble de vos équipes : présence, heures travaillées et alertes du jour.'
        eyebrow={
          <Chip color='accent' size='sm' variant='soft'>
            <Pulse width={12} />
            <Chip.Label>Espace manager</Chip.Label>
          </Chip>
        }
        title={
          currentUser ? `Bonjour, ${currentUser.firstName} 👋` : 'Bonjour 👋'
        }
      />

      <DashboardToolbar
        period={period}
        onCreateEmployee={openCreate}
        onPeriodChange={setPeriod}
      />

      <DashboardKpis isLoading={usersLoading} users={users} />

      <section className='grid grid-cols-1 gap-4 lg:grid-cols-3 3xl:gap-5 4xl:gap-6'>
        <HoursOverviewCard period={period} />
        <PresenceBreakdownCard
          isLoading={presence.isPending}
          users={presence.data ?? []}
        />
      </section>

      <section className='grid grid-cols-1 gap-4 lg:grid-cols-3 3xl:gap-5 4xl:gap-6'>
        <TeamOverviewCard
          isLoading={usersLoading}
          users={users}
          onDelete={setDeleteUser}
          onEdit={openEdit}
          onView={setViewUser}
        />
        <RecentActivityCard />
      </section>

      <EmployeeDrawer
        user={viewUser}
        onEdit={openEdit}
        onOpenChange={(open) => !open && setViewUser(null)}
      />
      <UserFormModal
        isOpen={formOpen}
        key={editUser?.id ?? 'new'}
        user={editUser}
        onOpenChange={setFormOpen}
      />
      <DeleteUserDialog user={deleteUser} onClose={() => setDeleteUser(null)} />
    </>
  );
}
