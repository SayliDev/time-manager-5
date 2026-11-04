import { PersonPlus, Pencil } from '@gravity-ui/icons';
import { useState } from 'react';
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
import { CONTRACT_HOURS, type User } from '@/features/users/types';
import { request, ApiError } from '@/shared/api/client';
import { useCreateUser } from '@/features/users/hooks/useUserMutations';
import { useTeams } from '@/features/users/hooks/useUsers';
import { fullName } from '@/features/users/lib/names';

interface UserFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
  user?: User | null;
}

const FORM_ID = 'user-form';
const MIN_PASSWORD_LENGTH = 8;

export function UserFormModal({
  isOpen,
  onOpenChange,
  onSaved,
  user,
}: UserFormModalProps) {
  const isEdit = Boolean(user);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createUser = useCreateUser();
  const { data: teams = [] } = useTeams();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO
    if (isEdit) return;

    const data = new FormData(e.currentTarget);
    const name = `${data.get('firstName')} ${data.get('lastName')}`;

    if (!isEdit) {
      setIsSubmitting(true);
      try {
        await request('/api/addUsers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            first_name: data.get('firstName'),
            last_name: data.get('lastName'),
            email: data.get('email'),
            role: data.get('role') === 'employee' ? 'employe' : data.get('role'),
            phone: data.get('phone') || null,
            contract_hours: Number(data.get('contractHours')),
            team_name: data.get('teamName') || null,
          }),
        });
        onSaved?.();
      } catch (error) {
        toast.danger('Création impossible', {
          description:
            error instanceof ApiError
              ? error.detail
              : 'Impossible de contacter le serveur.',
        });
        return;
      } finally {
        setIsSubmitting(false);
      }
    }

    toast.success(isEdit ? 'Employé mis à jour' : 'Employé créé', {
      description: isEdit
        ? `Les informations de ${name} ont été enregistrées.`
        : `${name} pourra se connecter avec son email professionnel.`,
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

              <Select
                isRequired
                defaultValue={String(user?.contractHours ?? 35)}
                fullWidth
                isDisabled={isEdit}
                name='contractHours'
                variant='secondary'
              >
                <Label>Contrat (heures / semaine)</Label>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {CONTRACT_HOURS.map((hours) => (
                      <ListBox.Item id={String(hours)} key={hours} textValue={`${hours} h`}>
                        {hours} h
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>

              <Select
                isRequired
                defaultValue={user?.teamName ?? undefined}
                fullWidth
                name='teamName'
                placeholder='Choisir une équipe'
                variant='secondary'
              >
                <Label>Équipe</Label>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {teams.map(({ name }) => (
                      <ListBox.Item
                        id={name}
                        key={name}
                        textValue={name}
                      >
                        {name}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
            </Form>
          </Modal.Body>

          <Modal.Footer>
            <Button slot='close' variant='tertiary'>
              Annuler
            </Button>
            <Button form={FORM_ID} isDisabled={isSubmitting} type='submit'>
              {isEdit ? 'Enregistrer' : 'Créer l’employé'}
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
