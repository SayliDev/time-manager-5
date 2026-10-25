import { PersonPlus } from '@gravity-ui/icons';
import {
  Button,
  Card,
  Kbd,
  Label,
  ListBox,
  SearchField,
  Select,
  Skeleton,
} from '@heroui/react';
import { useMemo, useState } from 'react';
import { DeleteUserDialog } from '@/features/users/components/DeleteUserDialog';
import { useUsers } from '@/features/users/hooks/useUsers';
import { fullName } from '@/features/users/lib/names';
import { EmployeeDrawer } from '@/features/users/EmployeeDrawer';
import { EmployeesTable } from '@/features/users/components/EmployeesTable';
import { UserFormModal } from '@/features/users/components/UserFormModal';
import type { User } from '@/features/users/types';
import { PageHeader } from '@/shared/ui/PageHeader';
import { SkeletonSwap } from '@/shared/ui/SkeletonSwap';

export function UsersPage() {
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('all');

  const [viewUser, setViewUser] = useState<User | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);

  const { data: users = [], isPending: usersLoading } = useUsers();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (role !== 'all' && u.role !== role) return false;
      if (!q) return true;
      return (
        fullName(u).toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    });
  }, [users, query, role]);

  const openCreate = () => {
    setEditUser(null);
    setFormOpen(true);
  };
  const openEdit = (user: User) => {
    setViewUser(null);
    setEditUser(user);
    setFormOpen(true);
  };

  return (
    <>
      <PageHeader
        actions={
          <Button onPress={openCreate}>
            <PersonPlus />
            Créer un employé
          </Button>
        }
        description='Créez, modifiez et supprimez les comptes de vos collaborateurs. Il n’y a pas d’inscription publique.'
        title='Employés'
      />

      <Card>
        <Card.Header>
          <div className='flex flex-col gap-3 md:flex-row md:items-end md:justify-between'>
            <SearchField
              aria-label='Rechercher un employé'
              className='w-full md:max-w-sm'
              value={query}
              variant='secondary'
              onChange={setQuery}
            >
              <SearchField.Group>
                <SearchField.SearchIcon />
                <SearchField.Input placeholder='Rechercher par nom ou email…' />
                <Kbd className='me-1.5 shrink-0' variant='light'>
                  <Kbd.Content>/</Kbd.Content>
                </Kbd>
                <SearchField.ClearButton />
              </SearchField.Group>
            </SearchField>

            <div className='flex flex-wrap items-center gap-2'>
              <Select
                aria-label='Filtrer par rôle'
                className='w-40'
                value={role}
                variant='secondary'
                onChange={(key) => setRole(String(key))}
              >
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    <ListBox.Item id='all' textValue='Tous les rôles'>
                      <Label>Tous les rôles</Label>
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                    <ListBox.Item id='admin' textValue='Administrateurs'>
                      <Label>Administrateurs</Label>
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                    <ListBox.Item id='manager' textValue='Managers'>
                      <Label>Managers</Label>
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                    <ListBox.Item id='employee' textValue='Employés'>
                      <Label>Employés</Label>
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  </ListBox>
                </Select.Popover>
              </Select>
            </div>
          </div>
        </Card.Header>

        <Card.Content>
          <EmployeesTable
            showRole
            isLoading={usersLoading}
            skeletonRows={8}
            users={filtered}
            onDelete={setDeleteUser}
            onEdit={openEdit}
            onView={setViewUser}
          />
        </Card.Content>

        <Card.Footer className='justify-between text-sm text-muted'>
          <SkeletonSwap
            isLoading={usersLoading}
            skeleton={
              <span className='flex h-5 items-center'>
                <Skeleton className='h-3.5 w-36 rounded-md' />
              </span>
            }
          >
            <span>
              {filtered.length} employé{filtered.length > 1 ? 's' : ''} sur{' '}
              {users.length}
            </span>
          </SkeletonSwap>
        </Card.Footer>
      </Card>

      <EmployeeDrawer
        user={viewUser}
        onEdit={openEdit}
        onOpenChange={(open) => !open && setViewUser(null)}
      />
      <UserFormModal
        isOpen={formOpen}
        key={editUser?.id ?? 'new'}
        user={editUser}
        onOpenChange={setFormOpen}
      />
      <DeleteUserDialog user={deleteUser} onClose={() => setDeleteUser(null)} />
    </>
  );
}
