import { Chip } from '@heroui/react';
import { useState } from 'react';
import { sileo } from 'sileo';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { ClockCard } from '@/features/dashboard/components/ClockCard';
import { EmployeeStats } from '@/features/dashboard/components/EmployeeStats';
import { MyWeekHoursCard } from '@/features/dashboard/components/MyWeekHoursCard';
import { RecentEntriesCard } from '@/features/dashboard/components/RecentEntriesCard';
import { useNow } from '@/features/dashboard/hooks/useNow';
import { toHHMM } from '@/features/dashboard/lib/clock';
import { ClockDialog } from '@/features/time/components/ClockDialog';
import { PageHeader } from '@/shared/ui/PageHeader';
import { useClockIn, useClockOut } from '../hooks/useClock';
import { ApiError } from '@/shared/api/client';
import { useTodaySession } from '../hooks/useTodaySession';
import { useWeekly } from '../hooks/useWeekly';
import { percentChange } from '../lib/stats';
import { getWorkWeek } from '../lib/week';

export function EmployeeDashboardPage() {
  const { data: currentUser } = useCurrentUser();
  const { data: openSession, isPending: sessionLoading } = useTodaySession(
    currentUser?.id,
  );

  const thisWeek = getWorkWeek(new Date());

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const lastWeek = getWorkWeek(weekAgo);

  // Du lundi de la semaine dernière au vendredi de cette semaine :
  // weeks[0] = semaine dernière, weeks[1] = cette semaine.
  const { data: weeks, isPending: weeklyLoading } = useWeekly(
    currentUser?.id,
    lastWeek.from,
    thisWeek.to,
  );
  const weekly = weeks?.[1]?.hours ?? 0;
  const lastWeekly = weeks?.[0]?.hours ?? 0;
  const weeklyDelta = percentChange(weekly, lastWeekly);

  const clockedIn = openSession != null;
  const since = openSession ? toHHMM(new Date(openSession.start_at)) : '';

  const now = useNow();

  const clockInMutation = useClockIn();
  const clockOutMutation = useClockOut();

  const isClocking = clockInMutation.isPending || clockOutMutation.isPending;

  const [dialogOpen, setDialogOpen] = useState(false);

  const confirmClock = () => {
    if (clockedIn) {
      clockOutMutation.mutate(undefined, {
        onSuccess: () => {
          sileo.success({
            title: 'Départ enregistré',
            description: 'Bonne soirée !',
          });
        },
        onError: (error) =>
          sileo.error({
            title: 'Pointage impossible',
            description:
              error instanceof ApiError
                ? error.detail
                : 'Une erreur est survenue.',
          }),
      });
    } else {
      clockInMutation.mutate('onsite', {
        onSuccess: (session) => {
          const time = toHHMM(new Date(session.start_at));
          sileo.success({
            title: 'Arrivée enregistrée',
            description: `À ${time}, bonne journée !`,
          });
        },
        onError: (error) =>
          sileo.error({
            title: 'Pointage impossible',
            description:
              error instanceof ApiError
                ? error.detail
                : 'Une erreur est survenue.',
          }),
      });
    }
  };

  return (
    <>
      <PageHeader
        description='Pointez votre arrivée et votre départ, et suivez votre temps de travail.'
        eyebrow={
          <Chip color='default' size='sm' variant='soft'>
            <Chip.Label>Espace employé</Chip.Label>
          </Chip>
        }
        title={
          currentUser ? `Bonjour, ${currentUser.firstName} 👋` : 'Bonjour 👋'
        }
      />

      <section className='grid grid-cols-1 gap-4 lg:grid-cols-3 3xl:gap-5 4xl:gap-6'>
        <ClockCard
          clockedIn={clockedIn}
          now={now}
          since={since}
          isLoading={sessionLoading}
          isSubmitting={isClocking}
          onClock={() => setDialogOpen(true)}
        />
        <EmployeeStats
          since={since}
          weekly={weekly}
          delta={weeklyDelta}
          isLoading={weeklyLoading}
        />
      </section>

      <section className='grid grid-cols-1 gap-4 lg:grid-cols-3 3xl:gap-5 4xl:gap-6'>
        <MyWeekHoursCard userId={currentUser?.id} />
        <RecentEntriesCard userId={currentUser?.id} />
      </section>

      <ClockDialog
        isOpen={dialogOpen}
        mode={clockedIn ? 'out' : 'in'}
        time={toHHMM(now)}
        onConfirm={confirmClock}
        isSubmitting={isClocking}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
