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
import { useWeekly } from '../hooks/useWeekly';

// Valeur de démo tant que l'API ne fournit pas les heures de la semaine.
const DEMO_WEEKLY_HOURS = 28.6;

export function EmployeeDashboardPage() {
  const { data: currentUser } = useCurrentUser();
  const now = useNow();

  const [clockedIn, setClockedIn] = useState(true);
  const [since, setSince] = useState('08:57');
  const [dialogOpen, setDialogOpen] = useState(false);

  const weekly = currentUser?.weeklyHours ?? DEMO_WEEKLY_HOURS;
  const { data: weekly2 = [], isPending: weeklyLoading } = useWeekly(
    currentUser?.id,
  );

  if (!weeklyLoading) {
    console.log('Data', weekly2);
  }

  // Pointage simulé côté client : aucun appel API pour l'instant.
  const confirmClock = () => {
    const time = toHHMM(now);
    if (clockedIn) {
      setClockedIn(false);
      sileo.success({
        title: 'Départ enregistré',
        description: `À ${time}, bonne soirée !`,
      });
    } else {
      setClockedIn(true);
      setSince(time);
      sileo.success({
        title: 'Arrivée enregistrée',
        description: `À ${time}, bonne journée !`,
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
          onClock={() => setDialogOpen(true)}
        />
        <EmployeeStats since={since} weekly={weekly} />
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
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
