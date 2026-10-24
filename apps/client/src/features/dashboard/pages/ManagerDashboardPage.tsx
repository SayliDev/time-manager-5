import { fullName } from '@/data/mock';
import { useUsers } from '@/data/mockQueries';
import { DashboardKpis } from '@/features/dashboard/components/DashboardKpis';
import { DashboardToolbar } from '@/features/dashboard/components/DashboardToolbar';
import { HoursOverviewCard } from '@/features/dashboard/components/HoursOverviewCard';
import { PresenceBreakdownCard } from '@/features/dashboard/components/PresenceBreakdownCard';
import { RecentActivityCard } from '@/features/dashboard/components/RecentActivityCard';
import { TeamOverviewCard } from '@/features/dashboard/components/TeamOverviewCard';
import type { DashboardPeriod } from '@/features/dashboard/types';
import { EmployeeDrawer } from '@/features/users/EmployeeDrawer';
import { UserFormModal } from '@/features/users/components/UserFormModal';
import type { PresenceStatus, User } from '@/features/users/types';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { PageHeader } from '@/shared/ui/PageHeader';
import { Pulse } from '@gravity-ui/icons';
import { Chip, toast } from '@heroui/react';
import { useMemo, useState } from 'react';

export function ManagerDashboardPage() {
  const [period, setPeriod] = useState<DashboardPeriod>('week');
  const [teamId, setTeamId] = useState<string>('all');

  const [viewUser, setViewUser] = useState<User | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);

  const { data: users, isPending: usersLoading } = useUsers();

  const scoped = useMemo(() => {
    const list = users ?? [];
    return teamId === 'all' ? list : list.filter((u) => u.teamId === teamId);
  }, [users, teamId]);

  const countBy = (status: PresenceStatus) =>
    scoped.filter((u) => u.presence === status).length;
  const clockedIn = scoped.filter((u) =>
    ['present', 'remote', 'late'].includes(u.presence),
  ).length;
  const lateCount = countBy('late');
  const absentCount = countBy('absent');
  const alerts = lateCount + absentCount;

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
        title={`Bonjour, John 👋`}
      />

      <DashboardToolbar
        period={period}
        teamId={teamId}
        onCreateEmployee={openCreate}
        onPeriodChange={setPeriod}
        onTeamChange={setTeamId}
      />

      {/* {usersLoading ? null : (
        <AttentionAlert absentCount={absentCount} lateCount={lateCount} />
      )} */}

      <DashboardKpis
        alerts={alerts}
        clockedIn={clockedIn}
        isLoading={usersLoading}
        totalEmployees={scoped.length}
      />

      <section className='grid grid-cols-1 gap-4 lg:grid-cols-3 3xl:gap-5 4xl:gap-6'>
        <HoursOverviewCard period={period} />
        <PresenceBreakdownCard isLoading={usersLoading} users={scoped} />
      </section>

      <section className='grid grid-cols-1 gap-4 lg:grid-cols-3 3xl:gap-5 4xl:gap-6'>
        <TeamOverviewCard
          isLoading={usersLoading}
          users={scoped}
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
      <ConfirmDialog
        confirmLabel='Supprimer'
        description={
          <>
            Vous allez supprimer{' '}
            <strong>{deleteUser ? fullName(deleteUser) : ''}</strong>. Son
            compte et ses accès seront définitivement invalidés.
          </>
        }
        isOpen={deleteUser !== null}
        title='Supprimer cet employé ?'
        onConfirm={() => {
          toast.danger('Employé supprimé', {
            description: `${
              deleteUser ? fullName(deleteUser) : ''
            } a été retiré.`,
          });
          setDeleteUser(null);
        }}
        onOpenChange={(open) => !open && setDeleteUser(null)}
      />
    </>
  );
}
