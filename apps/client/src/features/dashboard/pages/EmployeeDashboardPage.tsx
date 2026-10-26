import { Calendar, CircleInfo, Clock, Play, Stop } from '@gravity-ui/icons';
import { Button, Card, Chip, Label, Link, ProgressBar } from '@heroui/react';
import { useEffect, useState } from 'react';
import { sileo } from 'sileo';
import { useTimeEntries, useUserHours } from '@/data/mockQueries';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { ClockDialog } from '@/features/time/components/ClockDialog';
import { EntriesTable } from '@/features/time/components/EntriesTable';
import { WEEKLY_TARGET_HOURS } from '@/features/time/constants/weeklyRows';
import { appPath } from '@/features/widgets/layout/nav';
import { ChartSkeleton } from '@/shared/charts/ChartSkeleton';
import { HoursBarChart } from '@/shared/charts/HoursBarChart';
import { formatDecimal } from '@/shared/lib/format';
import { DemoBadge } from '@/shared/ui/DemoBadge';
import { PageHeader } from '@/shared/ui/PageHeader';
import { SkeletonSwap } from '@/shared/ui/SkeletonSwap';
import { StatCard } from '@/shared/ui/StatCard';

// Valeur de démo tant que l'API ne fournit pas les heures de la semaine.
const DEMO_WEEKLY_HOURS = 28.6;

const pad = (n: number) => String(n).padStart(2, '0');
const toHHMM = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

export function EmployeeDashboardPage() {
  const { data: currentUser } = useCurrentUser();
  const hoursQuery = useUserHours(currentUser?.id);
  const entriesQuery = useTimeEntries(currentUser?.id);

  const [now, setNow] = useState(() => new Date());
  const [clockedIn, setClockedIn] = useState(true);
  const [since, setSince] = useState('08:57');
  const [dialogOpen, setDialogOpen] = useState(false);

  // Horloge d'affichage purement visuelle.
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const weekly = currentUser?.weeklyHours ?? DEMO_WEEKLY_HOURS;
  const remaining = Math.max(0, WEEKLY_TARGET_HOURS - weekly);
  const progress = Math.min(100, (weekly / WEEKLY_TARGET_HOURS) * 100);

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
        {/* Pointeuse */}
        <Card className='relative overflow-hidden'>
          <div
            aria-hidden
            className='pointer-events-none absolute -top-16 -right-16 size-56 rounded-full bg-accent/15 blur-3xl'
          />
          <Card.Header className='relative'>
            <div className='flex items-center justify-between gap-3'>
              <Card.Title>Pointeuse</Card.Title>
              <Chip
                color={clockedIn ? 'success' : 'default'}
                size='sm'
                variant='soft'
              >
                <span
                  className={`tm-live relative size-1.5 rounded-full ${clockedIn ? 'bg-success' : 'bg-muted'}`}
                />
                <Chip.Label>{clockedIn ? 'En poste' : 'Hors poste'}</Chip.Label>
              </Chip>
            </div>
            <Card.Description className='capitalize'>
              {now.toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </Card.Description>
          </Card.Header>

          <Card.Content className='relative flex flex-col items-center gap-1 py-4'>
            <p
              aria-live='off'
              className='tabular text-6xl font-semibold tracking-tight text-foreground sm:text-7xl'
            >
              {pad(now.getHours())}
              <span className='mx-0.5 animate-pulse text-accent'>:</span>
              {pad(now.getMinutes())}
            </p>
            <p className='tabular text-sm text-muted'>
              {pad(now.getSeconds())} s
            </p>
            <p className='mt-3 text-sm text-muted'>
              {clockedIn ? (
                <>
                  Arrivée à{' '}
                  <strong className='tabular text-foreground'>{since}</strong>
                </>
              ) : (
                'Vous avez terminé votre journée.'
              )}
            </p>
          </Card.Content>

          <Card.Footer className='relative'>
            <Button
              fullWidth
              size='lg'
              variant={clockedIn ? 'danger' : 'primary'}
              onPress={() => setDialogOpen(true)}
            >
              {clockedIn ? <Stop /> : <Play />}
              {clockedIn ? 'Pointer mon départ' : 'Pointer mon arrivée'}
            </Button>
          </Card.Footer>
        </Card>

        {/* Stats */}
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-2 3xl:gap-5 4xl:gap-6'>
          <StatCard
            badge={<DemoBadge />}
            hint={`depuis ${since}`}
            icon={Clock}
            label='Aujourd’hui'
            tone='accent'
            value='4 h 24'
          />
          <StatCard
            badge={<DemoBadge />}
            delta={2.4}
            hint='vs semaine dernière'
            icon={Calendar}
            label='Cette semaine'
            tone='success'
            unit='h'
            value={formatDecimal(weekly)}
          />
          <Card className='gap-3 sm:col-span-2'>
            <ProgressBar aria-label='Progression hebdomadaire' value={progress}>
              <div className='flex items-baseline justify-between'>
                <div className='flex items-center gap-2'>
                  <Label>Objectif hebdomadaire</Label>
                  <DemoBadge />
                </div>
                <span className='tabular text-sm text-muted'>
                  <strong className='text-base font-semibold text-foreground'>
                    {formatDecimal(weekly)} h
                  </strong>{' '}
                  / {WEEKLY_TARGET_HOURS} h
                </span>
              </div>
              <ProgressBar.Track>
                <ProgressBar.Fill />
              </ProgressBar.Track>
            </ProgressBar>
            <p className='flex items-center gap-1.5 text-xs text-muted'>
              <CircleInfo className='size-3.5' />
              {remaining > 0
                ? `Il vous reste ${formatDecimal(remaining)} h pour atteindre votre objectif.`
                : 'Objectif de la semaine atteint.'}
            </p>
          </Card>
        </div>
      </section>

      <section className='grid grid-cols-1 gap-4 lg:grid-cols-3 3xl:gap-5 4xl:gap-6'>
        <Card>
          <Card.Header>
            <div className='flex items-center justify-between gap-2'>
              <Card.Title>Mes heures de la semaine</Card.Title>
              <DemoBadge />
            </div>
            <Card.Description>Par jour · objectif 7 h</Card.Description>
          </Card.Header>
          <Card.Content>
            <SkeletonSwap
              isLoading={hoursQuery.isPending}
              skeleton={<ChartSkeleton bars={5} height={220} />}
            >
              <HoursBarChart
                data={hoursQuery.data ?? []}
                height={220}
                target={7}
              />
            </SkeletonSwap>
          </Card.Content>
        </Card>

        <Card className='lg:col-span-2'>
          <Card.Header className='flex-row items-start justify-between gap-3'>
            <div>
              <div className='flex items-center gap-2'>
                <Card.Title>Derniers pointages</Card.Title>
                <DemoBadge />
              </div>
              <Card.Description>Vos 5 dernières journées</Card.Description>
            </div>
            <Link href={appPath('/time')}>
              Tout voir
              <Link.Icon />
            </Link>
          </Card.Header>
          <Card.Content>
            <EntriesTable
              entries={(entriesQuery.data ?? []).slice(0, 5)}
              isLoading={entriesQuery.isPending}
              skeletonRows={5}
            />
          </Card.Content>
        </Card>
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
