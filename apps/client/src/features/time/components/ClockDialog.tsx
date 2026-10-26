import { Clock, Play, Stop } from '@gravity-ui/icons';
import { Button, Kbd, Modal } from '@heroui/react';

interface ClockDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'in' | 'out';
  time: string;
  onConfirm: () => void;
}

export function ClockDialog({
  isOpen,
  onOpenChange,
  mode,
  time,
  onConfirm,
}: ClockDialogProps) {
  const isIn = mode === 'in';

  return (
    <Modal.Backdrop isOpen={isOpen} variant='blur' onOpenChange={onOpenChange}>
      <Modal.Container>
        <Modal.Dialog className='sm:max-w-[400px]'>
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Icon
              className={
                isIn
                  ? 'bg-success-soft text-success-soft-foreground'
                  : 'bg-danger-soft text-danger-soft-foreground'
              }
            >
              {isIn ? <Play className='size-5' /> : <Stop className='size-5' />}
            </Modal.Icon>
            <Modal.Heading>
              {isIn ? 'Pointer votre arrivée' : 'Pointer votre départ'}
            </Modal.Heading>
          </Modal.Header>
          <Modal.Body>
            <div className='flex flex-col items-center gap-2 rounded-lg bg-default py-6'>
              <Clock className='size-5 text-muted' />
              <p className='tabular text-4xl font-semibold tracking-tight'>
                {time}
              </p>
              <p className='text-xs text-muted'>
                Heure enregistrée par le serveur
              </p>
            </div>
            <p className='mt-4 text-sm text-muted'>
              {isIn
                ? 'Votre journée de travail démarre à cette heure.'
                : 'Votre journée de travail se termine à cette heure. Vous pourrez la consulter dans « Pointages ».'}
            </p>
            <p className='mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted'>
              <span className='inline-flex items-center gap-1.5'>
                <Kbd variant='light'>
                  <Kbd.Abbr keyValue='escape' />
                </Kbd>
                annuler
              </span>
              <span className='inline-flex items-center gap-1.5'>
                <Kbd variant='light'>
                  <Kbd.Abbr keyValue='enter' />
                </Kbd>
                confirmer
              </span>
            </p>
          </Modal.Body>
          <Modal.Footer>
            <Button slot='close' variant='tertiary'>
              Annuler
            </Button>
            <Button
              slot='close'
              variant={isIn ? 'primary' : 'danger'}
              onPress={onConfirm}
            >
              {isIn ? 'Confirmer l’arrivée' : 'Confirmer le départ'}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
