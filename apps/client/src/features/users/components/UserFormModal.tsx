import { PersonPlus, Pencil } from '@gravity-ui/icons';
import {
  Button,
  Description,
  FieldError,
  Form,
  Input,
  Label,
  ListBox,
  Modal,
  Select,
  TextField,
  toast,
} from '@heroui/react';
import { useCreateUser } from '@/features/users/hooks/useUserMutations';
import { fullName } from '@/features/users/lib/names';
import type { Role, User } from '@/features/users/types';
import { ApiError } from '@/shared/api/client';

interface UserFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
}

const FORM_ID = 'user-form';
const MIN_PASSWORD_LENGTH = 8;

export function UserFormModal({
  isOpen,
  onOpenChange,
  user,
}: UserFormModalProps) {
  const isEdit = Boolean(user);
  const createUser = useCreateUser();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO
    if (isEdit) return;

    const data = new FormData(e.currentTarget);
    const field = (name: string) => String(data.get(name) ?? '').trim();
    const input = {
      firstName: field('firstName'),
      lastName: field('lastName'),
      email: field('email'),
      password: String(data.get('password') ?? ''),
      role: field('role') as Role,
      phone: field('phone') || null,
    };

    createUser.mutate(input, {
      onSuccess: (created) => {
        toast.success('Employé créé', {
          description: `${fullName(created)} peut se connecter avec son email professionnel.`,
        });
        onOpenChange(false);
      },
      onError: (error) =>
        toast.danger('Création impossible', {
          description:
            error instanceof ApiError
              ? error.detail
              : 'Une erreur est survenue.',
        }),
    });
  };

  return (
    <Modal.Backdrop isOpen={isOpen} variant='blur' onOpenChange={onOpenChange}>
      <Modal.Container scroll='inside'>
        <Modal.Dialog className='sm:max-w-[520px]'>
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Icon className='bg-accent-soft text-accent-soft-foreground'>
              {isEdit ? (
                <Pencil className='size-5' />
              ) : (
                <PersonPlus className='size-5' />
              )}
            </Modal.Icon>
            <Modal.Heading>
              {isEdit && user
                ? `Modifier ${fullName(user)}`
                : 'Créer un employé'}
            </Modal.Heading>
            <p className='text-sm text-muted'>
              {isEdit
                ? 'Mettez à jour les informations du collaborateur.'
                : 'Les comptes sont créés par les managers : aucune inscription publique.'}
            </p>
          </Modal.Header>

          <Modal.Body className='flex flex-col gap-4'>
            <Form
              className='grid grid-cols-1 gap-4 sm:grid-cols-2'
              id={FORM_ID}
              onSubmit={handleSubmit}
            >
              <TextField
                isRequired
                defaultValue={user?.firstName}
                isDisabled={isEdit}
                name='firstName'
                variant='secondary'
              >
                <Label>Prénom</Label>
                <Input placeholder='John' />
                <FieldError />
              </TextField>
              <TextField
                isRequired
                defaultValue={user?.lastName}
                isDisabled={isEdit}
                name='lastName'
                variant='secondary'
              >
                <Label>Nom</Label>
                <Input placeholder='Doe' />
                <FieldError />
              </TextField>

              <TextField
                isRequired
                className='sm:col-span-2'
                defaultValue={user?.email}
                isDisabled={isEdit}
                name='email'
                type='email'
                variant='secondary'
              >
                <Label>Email professionnel</Label>
                <Input placeholder='prenom.nom@trinitymarket.com' />
                <Description>
                  Sert d’identifiant de connexion (ou via Microsoft).
                </Description>
                <FieldError />
              </TextField>

              {isEdit ? null : (
                <TextField
                  isRequired
                  className='sm:col-span-2'
                  minLength={MIN_PASSWORD_LENGTH}
                  name='password'
                  type='password'
                  variant='secondary'
                >
                  <Label>Mot de passe provisoire</Label>
                  <Input autoComplete='new-password' />
                  <Description>
                    {MIN_PASSWORD_LENGTH} caractères minimum, à transmettre au
                    collaborateur.
                  </Description>
                  <FieldError />
                </TextField>
              )}

              <TextField
                defaultValue={user?.phone ?? undefined}
                isDisabled={isEdit}
                name='phone'
                type='tel'
                variant='secondary'
              >
                <Label>Téléphone</Label>
                <Input placeholder='+33 6 00 00 00 00' />
                <FieldError />
              </TextField>

              <Select
                isRequired
                defaultValue={user?.role ?? 'employee'}
                fullWidth
                isDisabled={isEdit}
                name='role'
                placeholder='Choisir un rôle'
                variant='secondary'
              >
                <Label>Rôle</Label>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    <ListBox.Item id='employee' textValue='Employé'>
                      Employé
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                    <ListBox.Item id='manager' textValue='Manager'>
                      Manager
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  </ListBox>
                </Select.Popover>
              </Select>
            </Form>
          </Modal.Body>

          <Modal.Footer>
            <Button slot='close' variant='tertiary'>
              {isEdit ? 'Fermer' : 'Annuler'}
            </Button>
            {isEdit ? null : (
              <Button
                form={FORM_ID}
                isPending={createUser.isPending}
                type='submit'
              >
                Créer l’employé
              </Button>
            )}
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
