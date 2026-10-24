import { Layers3Diagonal } from '@gravity-ui/icons';
import {
  Button,
  Checkbox,
  CheckboxGroup,
  Description,
  FieldError,
  Form,
  Input,
  Label,
  ListBox,
  Modal,
  Select,
  TextArea,
  TextField,
  toast,
} from '@heroui/react';
import { fullName, users } from '@/data/mock';
import type { Team } from '@/features/teams/types';

interface TeamFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  team?: Team | null;
}

const FORM_ID = 'team-form';
const managers = users.filter((u) => u.role === 'manager');

export function TeamFormModal({
  isOpen,
  onOpenChange,
  team,
}: TeamFormModalProps) {
  const isEdit = Boolean(team);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const name = new FormData(e.currentTarget).get('name');
    toast.success(isEdit ? 'Équipe mise à jour' : 'Équipe créée', {
      description: `« ${name} » a été enregistrée.`,
    });
    onOpenChange(false);
  };

  return (
    <Modal.Backdrop isOpen={isOpen} variant='blur' onOpenChange={onOpenChange}>
      <Modal.Container scroll='inside'>
        <Modal.Dialog className='sm:max-w-[560px]'>
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Icon className='bg-accent-soft text-accent-soft-foreground'>
              <Layers3Diagonal className='size-5' />
            </Modal.Icon>
            <Modal.Heading>
              {isEdit ? `Modifier « ${team?.name} »` : 'Créer une équipe'}
            </Modal.Heading>
            <p className='text-sm text-muted'>
              Définissez le nom, le manager responsable et les membres de
              l’équipe.
            </p>
          </Modal.Header>

          <Modal.Body>
            <Form
              className='flex flex-col gap-4'
              id={FORM_ID}
              onSubmit={handleSubmit}
            >
              <TextField
                isRequired
                defaultValue={team?.name}
                name='name'
                variant='secondary'
              >
                <Label>Nom de l’équipe</Label>
                <Input placeholder='Ex. Service client' />
                <FieldError />
              </TextField>

              <TextField
                defaultValue={team?.description}
                name='description'
                variant='secondary'
              >
                <Label>Description</Label>
                <TextArea
                  className='min-h-20'
                  placeholder='Rôle et périmètre de l’équipe…'
                />
              </TextField>

              <Select
                isRequired
                defaultValue={team?.managerId}
                fullWidth
                name='managerId'
                placeholder='Choisir un manager'
                variant='secondary'
              >
                <Label>Manager</Label>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {managers.map((m) => (
                      <ListBox.Item
                        id={m.id}
                        key={m.id}
                        textValue={fullName(m)}
                      >
                        {fullName(m)}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>

              <CheckboxGroup
                defaultValue={team?.memberIds ?? []}
                name='members'
              >
                <Label>Membres</Label>
                <Description>
                  Sélectionnez les collaborateurs de cette équipe.
                </Description>
                <div className='grid max-h-48 grid-cols-1 gap-2 overflow-y-auto rounded-lg border border-separator p-3 sm:grid-cols-2'>
                  {users.map((u) => (
                    <Checkbox key={u.id} value={u.id}>
                      <Checkbox.Content>
                        <Checkbox.Control>
                          <Checkbox.Indicator />
                        </Checkbox.Control>
                        {fullName(u)}
                      </Checkbox.Content>
                    </Checkbox>
                  ))}
                </div>
              </CheckboxGroup>
            </Form>
          </Modal.Body>

          <Modal.Footer>
            <Button slot='close' variant='tertiary'>
              Annuler
            </Button>
            <Button form={FORM_ID} type='submit'>
              {isEdit ? 'Enregistrer' : 'Créer l’équipe'}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
