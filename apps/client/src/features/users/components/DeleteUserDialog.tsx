import { toast } from '@heroui/react';
import { useDeactivateUser } from '@/features/users/hooks/useUserMutations';
import { fullName } from '@/features/users/lib/names';
import type { User } from '@/features/users/types';
import { ApiError } from '@/shared/api/client';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';

interface DeleteUserDialogProps {
  user: User | null;
  onClose: () => void;
}

export function DeleteUserDialog({ user, onClose }: DeleteUserDialogProps) {
  const deactivate = useDeactivateUser();
  const name = user ? fullName(user) : '';

  return (
    <ConfirmDialog
      confirmLabel='Supprimer'
      description={
        <>
          Vous allez supprimer <strong>{name}</strong>. Son compte et ses accès
          seront désactivés.
        </>
      }
      isOpen={user !== null}
      title='Supprimer cet employé ?'
      onConfirm={() => {
        if (!user) return;
        deactivate.mutate(user.id, {
          onSuccess: () =>
            toast.danger('Employé supprimé', {
              description: `${name} a été retiré.`,
            }),
          onError: (error) =>
            toast.danger('Suppression impossible', {
              description:
                error instanceof ApiError
                  ? error.detail
                  : 'Une erreur est survenue.',
            }),
        });
        onClose();
      }}
      onOpenChange={(open) => !open && onClose()}
    />
  );
}
