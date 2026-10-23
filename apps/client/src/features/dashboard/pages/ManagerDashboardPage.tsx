import { Pulse } from '@gravity-ui/icons';
import { Button, Card, Chip, toast } from '@heroui/react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchDashboard } from '@/shared/api/client';
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
import { useProfile } from '@/features/auth/hooks/useProfile';
import { Link } from 'react-router-dom';

const fullName = (user: User) =>
  `${user.firstName} ${user.lastName}`;

export function ManagerDashboardPage() {
  const profile = useProfile();
  const [period, setPeriod] = useState<DashboardPeriod>('week');
  const [teamId, setTeamId] = useState<string>('all');

  const [viewUser, setViewUser] = useState<User | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);

  const { data: dashboard, error, refetch, isFetching } = useQuery({
    queryKey: ['dashboard', teamId, period],
    queryFn: ({ signal }) => fetchDashboard(teamId, period, signal),
    refetchInterval: 60_000,
  });

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
  if (error || profile.error) {
    return <p role='alert'>{(error || profile.error)?.message}</p>;
  }

  if (!dashboard || profile.isPending) {
    return <p role='status'>Chargement…</p>;
  }

  if (profile.data?.role === 'manager' && dashboard.teams.length === 0) {
    return (
      <>
        <PageHeader title='Tableau de bord' description={`Bonjour ${profile.data.firstName}`} />
        <Card>
          <Card.Header>
            <Card.Title>Aucune équipe à gérer</Card.Title>
          </Card.Header>
          <Card.Content>
            <p role='status'>
              Votre compte manager n’est encore responsable d’aucune équipe.
              Un administrateur doit vous rattacher à une équipe pour afficher ses collaborateurs,
              ses pointages et ses indicateurs.
            </p>
          </Card.Content>
          <Card.Footer className='gap-3'>
            <Button isDisabled={isFetching} onPress={() => { void refetch(); }}>Actualiser</Button>
            <Link to={`/dashboard/time?user_id=${encodeURIComponent(profile.data.id)}`}>Voir mes pointages</Link>
          </Card.Footer>
        </Card>
      </>
    );
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
        indicators={dashboard.kpis}
        alerts={dashboard.kpis.alerts}
        clockedIn={dashboard.stats.clockedToday}
        attendance={dashboard.kpis.attendance_rate.value}
        averageWeeklyHours={dashboard.kpis.avg_weekly_hours.value}
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
