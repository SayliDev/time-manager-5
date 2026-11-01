import { Play, Stop } from '@gravity-ui/icons';
import { Button, Card, Chip } from '@heroui/react';
import { pad } from '@/features/dashboard/lib/clock';

interface ClockCardProps {
  now: Date;
  clockedIn: boolean;
  since: string;
  isLoading: boolean;
  isSubmitting: boolean;
  onClock: () => void;
}

export function ClockCard({
  now,
  clockedIn,
  since,
  isLoading,
  isSubmitting,
  onClock,
}: ClockCardProps) {
  let label = 'Pointer mon arrivée';
  if (isLoading) label = 'Chargement…';
  else if (isSubmitting) label = 'Enregistrement…';
  else if (clockedIn) label = 'Pointer mon départ';

  return (
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
        <p className='tabular text-sm text-muted'>{pad(now.getSeconds())} s</p>
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
          isDisabled={isLoading || isSubmitting}
          onPress={onClock}
        >
          {clockedIn ? <Stop /> : <Play />}
          {label}
        </Button>
      </Card.Footer>
    </Card>
  );
}
