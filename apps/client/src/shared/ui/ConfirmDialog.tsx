import { AlertDialog, Button, Kbd } from '@heroui/react';
import type { ReactNode } from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  status?: 'danger' | 'warning' | 'accent' | 'success';
  onConfirm: () => void;
}

export function ConfirmDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  status = 'danger',
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <AlertDialog.Backdrop
      isOpen={isOpen}
      variant='blur'
      onOpenChange={onOpenChange}
    >
      <AlertDialog.Container>
        <AlertDialog.Dialog className='sm:max-w-[420px]'>
          <AlertDialog.CloseTrigger />
          <AlertDialog.Header>
            <AlertDialog.Icon status={status} />
            <AlertDialog.Heading>{title}</AlertDialog.Heading>
          </AlertDialog.Header>
          <AlertDialog.Body>
            <div className='text-sm text-muted'>{description}</div>
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
          </AlertDialog.Body>
          <AlertDialog.Footer>
            <Button slot='close' variant='tertiary'>
              {cancelLabel}
            </Button>
            <Button
              slot='close'
              variant={status === 'danger' ? 'danger' : 'primary'}
              onPress={onConfirm}
            >
              {confirmLabel}
            </Button>
          </AlertDialog.Footer>
        </AlertDialog.Dialog>
      </AlertDialog.Container>
    </AlertDialog.Backdrop>
  );
}
