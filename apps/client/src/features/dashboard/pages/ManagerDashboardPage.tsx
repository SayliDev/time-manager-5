import { Pulse } from '@gravity-ui/icons';
import { Chip, toast } from '@heroui/react';
import { useEffect, useState } from 'react';
import {fetchDashboard, type DashboardData} from '@/features/dashboard/api';
import { DashboardKpis } from '@/features/dashboard/components/DashboardKpis';
import { DashboardToolbar } from '@/features/dashboard/components/DashboardToolbar';
import { HoursOverviewCard } from '@/features/dashboard/components/HoursOverviewCard';
import { PresenceBreakdownCard } from '@/features/dashboard/components/PresenceBreakdownCard';
import { RecentActivityCard } from '@/features/dashboard/components/RecentActivityCard';
import { TeamOverviewCard } from '@/features/dashboard/components/TeamOverviewCard';
import type { DashboardPeriod } from '@/features/dashboard/types';
import { EmployeeDrawer } from '@/features/users/EmployeeDrawer';
import { UserFormModal } from '@/features/users/components/UserFormModal';
import type { User } from '@/features/users/types';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { PageHeader } from '@/shared/ui/PageHeader';

const fullName = (user: User) =>
  `${user.firstName} ${user.lastName}`;

export function ManagerDashboardPage() {
  const [period, setPeriod] = useState<DashboardPeriod>('week');
  const [teamId, setTeamId] = useState<string>('all');

  const [viewUser, setViewUser] = useState<User | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);

const [dashboard, setDashboard] = useState<DashboardData | null>(null);
const [error, setError] = useState('');

useEffect(() => {
  const controller = new AbortController();

  setDashboard(null);
  setError('');

  fetchDashboard(teamId, period, controller.signal)
    .then(setDashboard)
    .catch((error: Error) => {
      if (error.name !== 'AbortError') {
        setError(error.message);
      }
    });

  return () => controller.abort();
}, [teamId, period]);

const scoped = dashboard?.users ?? [];

  const openCreate = () => {
    setEditUser(null);
    setFormOpen(true);
  };
  const openEdit = (user: User) => {
    setViewUser(null);
    setEditUser(user);
    setFormOpen(true);
  };
  if (error) {
    return <p role='alert'>{error}</p>;
  }

  if (!dashboard) {
    return <p role='status'>Chargement…</p>;
  }

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
        title={`Bonjour 👋`}
      />

      <DashboardToolbar
        teams={dashboard.teams}
        period={period}
        teamId={teamId}
        onCreateEmployee={openCreate}
        onPeriodChange={setPeriod}
        onTeamChange={setTeamId}
      />

      {/*<AttentionAlert absentCount={absentCount} lateCount={lateCount} />*/}

      <DashboardKpis
        alerts={dashboard.stats.alerts}
        clockedIn={dashboard.stats.clockedToday}
        attendance={dashboard.stats.attendance}
        averageWeeklyHours={dashboard.stats.averageWeeklyHours}
        totalEmployees={scoped.length}
/>

      <section className='grid grid-cols-1 gap-4 lg:grid-cols-3 3xl:gap-5 4xl:gap-6'>
        <HoursOverviewCard
          period={period}
          data={dashboard.hours}
        />

        <PresenceBreakdownCard
          users={scoped}
        />
      </section>

      <section className='grid grid-cols-1 gap-4 lg:grid-cols-3 3xl:gap-5 4xl:gap-6'>
        <TeamOverviewCard
          users={scoped}
          onDelete={setDeleteUser}
          onEdit={openEdit}
          onView={setViewUser}
        />
        <RecentActivityCard
          activity={dashboard.activity}
          users={scoped}
        />
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
          toast.danger('suprétion non connecté a l api', {
            
          });
          setDeleteUser(null);
        }}
        onOpenChange={(open) => !open && setDeleteUser(null)}
      />
    </>
  );
}
