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
  toast,
} from '@heroui/react';
import { useEffect, useMemo, useState } from 'react';
import { DeleteUserDialog } from '@/features/users/components/DeleteUserDialog';
import { fullName } from '@/features/users/lib/names';
import { EmployeeDrawer } from '@/features/users/EmployeeDrawer';
import { EmployeesTable } from '@/features/users/components/EmployeesTable';
import { UserFormModal } from '@/features/users/components/UserFormModal';
import type { User } from '@/features/users/types';
import { PageHeader } from '@/shared/ui/PageHeader';
import { SkeletonSwap } from '@/shared/ui/SkeletonSwap';

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8001';

type EmployeeApiRow = {
  id_user: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  phone: string | null;
  id_team: number | null;
  team_name: string | null;
  weekly_hours: number;
  last_clock_start: string | null;
  last_clock_end: string | null;
  presence: User['presence'];
};

function mapEmployee(row: EmployeeApiRow): User {
  const lastClock = row.last_clock_end ?? row.last_clock_start;

  return {
    id: String(row.id_user),
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone ?? '',
    role: row.role === 'admin' || row.role === 'manager' ? row.role : 'employee',
    createdAt: null,
    deactivatedAt: null,
    teamId: row.id_team === null ? null : String(row.id_team),
    teamName: row.team_name,
    presence: row.presence,
    weeklyHours: row.weekly_hours,
    lastClock: lastClock
      ? `${row.last_clock_end ? 'Départ' : 'Arrivée'} ${new Date(
          lastClock
        ).toLocaleString('fr-FR')}`
      : '—',
  };
}

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('all');
  const [teamName, setTeamName] = useState('all');

  const [viewUser, setViewUser] = useState<User | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

    fetch(`${apiUrl}/api/all/details`, {
      credentials: 'include',
      headers,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Impossible de récupérer les employés.');
        }

        const rows = (await response.json()) as EmployeeApiRow[];
        setUsers(rows.map(mapEmployee));
      })
      .catch((error: Error) => {
        toast.danger('Chargement impossible', {
          description: error.message,
        });
      })
      .finally(() => setUsersLoading(false));
  }, [refreshKey]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (role !== 'all' && u.role !== role) return false;
      if (teamName !== 'all' && u.teamName !== teamName) return false;
      if (!q) return true;
      return (
        fullName(u).toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    });
  }, [users, query, role, teamName]);

  const teamOptions = useMemo(
    () =>
      Array.from(
        new Set(
          users
            .map((user) => user.teamName)
            .filter((name): name is string => Boolean(name))
        )
      ).sort((first, second) => first.localeCompare(second)),
    [users]
  );

  const roleOptions = useMemo(
    () =>
      Array.from(new Set(users.map((user) => user.role).filter(Boolean))).sort(
        (first, second) => first.localeCompare(second)
      ),
    [users]
  );

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
                    {roleOptions.map((value) => (
                      <ListBox.Item id={value} key={value} textValue={value}>
                        <Label>{value}</Label>
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>

              <Select
                aria-label='Filtrer par équipe'
                className='w-52'
                value={teamName}
                variant='secondary'
                onChange={(key) => setTeamName(String(key))}
              >
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    <ListBox.Item id='all' textValue='Toutes les équipes'>
                      <Label>Toutes les équipes</Label>
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                    {teamOptions.map((name) => (
                      <ListBox.Item id={name} key={name} textValue={name}>
                        <Label>{name}</Label>
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
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
        onSaved={() => {
          setUsersLoading(true);
          setRefreshKey((key) => key + 1);
        }}
        onOpenChange={setFormOpen}
      />
      <DeleteUserDialog user={deleteUser} onClose={() => setDeleteUser(null)} />
    </>
  );
}
