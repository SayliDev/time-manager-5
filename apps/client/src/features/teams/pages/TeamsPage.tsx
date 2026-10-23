import {
  EllipsisVertical,
  Eye,
  Pencil,
  Plus,
  TrashBin,
} from '@gravity-ui/icons';
import {
  Avatar,
  AvatarGroup,
  Button,
  Card,
  Chip,
  Drawer,
  Dropdown,
  Kbd,
  Label,
  Meter,
  Separator,
  Skeleton,
  toast,
} from '@heroui/react';
import { useState } from 'react';
import { fullName, getUser, initials } from '@/data/mock';
import { useTeams } from '@/data/mockQueries';
import { TeamFormModal } from '@/features/teams/components/TeamFormModal';
import type { Team } from '@/features/teams/types';
import { formatDecimal } from '@/shared/lib/format';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { PageHeader } from '@/shared/ui/PageHeader';
import { SkeletonSwap } from '@/shared/ui/SkeletonSwap';
import { PresenceChip } from '@/shared/ui/StatusChips';
import { UserAvatar } from '@/shared/ui/UserAvatar';

const gridClassName =
  'grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4 3xl:gap-5 4xl:gap-6';

const newTeamTileClassName =
  'flex min-h-64 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border text-muted outline-none transition-colors hover:border-accent hover:bg-accent-soft hover:text-accent-soft-foreground focus-visible:ring-2 focus-visible:ring-focus';

export function TeamsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editTeam, setEditTeam] = useState<Team | null>(null);
  const [viewTeam, setViewTeam] = useState<Team | null>(null);
  const [deleteTeam, setDeleteTeam] = useState<Team | null>(null);

  const { data: teams = [], isPending: teamsLoading } = useTeams();

  const openCreate = () => {
    setEditTeam(null);
    setFormOpen(true);
  };
  const openEdit = (team: Team) => {
    setViewTeam(null);
    setEditTeam(team);
    setFormOpen(true);
  };

  const viewManager = getUser(viewTeam?.managerId);

  return (
    <>
      <PageHeader
        actions={
          <Button onPress={openCreate}>
            <Plus />
            Créer une équipe
          </Button>
        }
        description='Organisez vos collaborateurs en équipes et suivez leur charge de travail.'
        title='Équipes'
      />

      <SkeletonSwap
        isLoading={teamsLoading}
        skeleton={
          <div className={gridClassName}>
            {Array.from({ length: 3 }, (_, i) => (
              <TeamCardSkeleton key={i} />
            ))}
            <div className={newTeamTileClassName}>
              <NewTeamTileContent />
            </div>
          </div>
        }
      >
        <section className={gridClassName}>
          {teams.map((team) => {
            const manager = getUser(team.managerId);
            const members = team.memberIds
              .map((id) => getUser(id))
              .filter((u) => u !== undefined);
            return (
              <Card className='gap-4' key={team.id}>
                <Card.Header className='flex-row items-start justify-between gap-3'>
                  <div className='min-w-0'>
                    <Card.Title className='truncate'>{team.name}</Card.Title>
                    <Card.Description className='line-clamp-2'>
                      {team.description}
                    </Card.Description>
                  </div>
                  <Dropdown>
                    <Button
                      isIconOnly
                      aria-label={`Actions pour ${team.name}`}
                      size='sm'
                      variant='ghost'
                    >
                      <EllipsisVertical />
                    </Button>
                    <Dropdown.Popover className='min-w-[220px]'>
                      <Dropdown.Menu
                        onAction={(key) => {
                          if (key === 'view') setViewTeam(team);
                          if (key === 'edit') openEdit(team);
                          if (key === 'delete') setDeleteTeam(team);
                        }}
                      >
                        <Dropdown.Item id='view' textValue='Voir les membres'>
                          <Eye className='size-4 shrink-0 text-muted' />
                          <Label className='flex-1'>Voir les membres</Label>
                          <Kbd variant='light'>
                            <Kbd.Content>V</Kbd.Content>
                          </Kbd>
                        </Dropdown.Item>
                        <Dropdown.Item id='edit' textValue='Modifier'>
                          <Pencil className='size-4 shrink-0 text-muted' />
                          <Label className='flex-1'>Modifier</Label>
                          <Kbd variant='light'>
                            <Kbd.Content>E</Kbd.Content>
                          </Kbd>
                        </Dropdown.Item>
                        <Dropdown.Item
                          id='delete'
                          textValue='Supprimer'
                          variant='danger'
                        >
                          <TrashBin className='size-4 shrink-0 text-danger' />
                          <Label className='flex-1'>Supprimer</Label>
                          <Kbd variant='light'>
                            <Kbd.Abbr keyValue='delete' />
                          </Kbd>
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown.Popover>
                  </Dropdown>
                </Card.Header>

                <Card.Content className='flex flex-col gap-4'>
                  <div className='flex items-center justify-between'>
                    <AvatarGroup>
                      {members.slice(0, 4).map((u) => (
                        <Avatar aria-label={fullName(u)} key={u.id} size='sm'>
                          <Avatar.Fallback>{initials(u)}</Avatar.Fallback>
                        </Avatar>
                      ))}
                      {members.length > 4 ? (
                        <AvatarGroup.Count>
                          +{members.length - 4}
                        </AvatarGroup.Count>
                      ) : null}
                    </AvatarGroup>
                    <Chip size='sm' variant='soft'>
                      <Chip.Label>
                        {team.memberIds.length} membre
                        {team.memberIds.length > 1 ? 's' : ''}
                      </Chip.Label>
                    </Chip>
                  </div>

                  <Meter
                    aria-label={`Heures moyennes de ${team.name}`}
                    color={team.avgWeeklyHours < 32 ? 'warning' : 'accent'}
                    maxValue={40}
                    value={team.avgWeeklyHours}
                  >
                    <div className='flex items-center justify-between text-sm'>
                      <Label>Heures moy. / semaine</Label>
                      <span className='tabular font-medium'>
                        {formatDecimal(team.avgWeeklyHours)} h
                      </span>
                    </div>
                    <Meter.Track>
                      <Meter.Fill />
                    </Meter.Track>
                  </Meter>

                  <Meter
                    aria-label={`Taux de présence de ${team.name}`}
                    color={team.attendanceRate < 85 ? 'warning' : 'success'}
                    value={team.attendanceRate}
                  >
                    <div className='flex items-center justify-between text-sm'>
                      <Label>Taux de présence</Label>
                      <span className='tabular font-medium'>
                        {team.attendanceRate} %
                      </span>
                    </div>
                    <Meter.Track>
                      <Meter.Fill />
                    </Meter.Track>
                  </Meter>
                </Card.Content>

                <Separator />

                <Card.Footer className='justify-between'>
                  {manager ? (
                    <div className='flex items-center gap-2 text-sm'>
                      <UserAvatar size='sm' user={manager} />
                      <div className='leading-tight'>
                        <p className='text-xs text-muted'>Manager</p>
                        <p className='font-medium'>{fullName(manager)}</p>
                      </div>
                    </div>
                  ) : (
                    <span />
                  )}
                  <Button
                    size='sm'
                    variant='tertiary'
                    onPress={() => setViewTeam(team)}
                  >
                    Détails
                  </Button>
                </Card.Footer>
              </Card>
            );
          })}

          <button
            className={newTeamTileClassName}
            type='button'
            onClick={openCreate}
          >
            <NewTeamTileContent />
          </button>
        </section>
      </SkeletonSwap>

      <Drawer.Backdrop
        isOpen={viewTeam !== null}
        variant='blur'
        onOpenChange={(open) => !open && setViewTeam(null)}
      >
        <Drawer.Content placement='right'>
          <Drawer.Dialog
            aria-label='Détail de l’équipe'
            className='w-full max-w-[440px]'
          >
            <Drawer.CloseTrigger />
            {viewTeam ? (
              <>
                <Drawer.Header>
                  <Drawer.Heading>{viewTeam.name}</Drawer.Heading>
                  <p className='text-sm text-muted'>{viewTeam.description}</p>
                </Drawer.Header>
                <Drawer.Body className='flex flex-col gap-5'>
                  {viewManager ? (
                    <div className='flex items-center gap-3 rounded-lg bg-default p-3'>
                      <UserAvatar user={viewManager} />
                      <div>
                        <p className='text-xs text-muted'>
                          Manager de l’équipe
                        </p>
                        <p className='text-sm font-medium'>
                          {fullName(viewManager)}
                        </p>
                      </div>
                    </div>
                  ) : null}

                  <div>
                    <h3 className='mb-2 text-sm font-semibold'>
                      Membres ({viewTeam.memberIds.length})
                    </h3>
                    <ul className='flex flex-col divide-y divide-separator'>
                      {viewTeam.memberIds.map((id) => {
                        const u = getUser(id);
                        if (!u) return null;
                        return (
                          <li
                            className='flex items-center justify-between gap-3 py-3'
                            key={id}
                          >
                            <div className='flex min-w-0 items-center gap-3'>
                              <UserAvatar size='sm' user={u} />
                              <div className='min-w-0'>
                                <p className='truncate text-sm font-medium'>
                                  {fullName(u)}
                                </p>
                                <p className='tabular text-xs text-muted'>
                                  {formatDecimal(u.weeklyHours ?? 0)} h cette
                                  semaine
                                </p>
                              </div>
                            </div>
                            {u.presence ? (
                              <PresenceChip status={u.presence} />
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </Drawer.Body>
                <Drawer.Footer>
                  <Button slot='close' variant='tertiary'>
                    Fermer
                  </Button>
                  <Button onPress={() => openEdit(viewTeam)}>
                    <Pencil />
                    Modifier l’équipe
                  </Button>
                </Drawer.Footer>
              </>
            ) : null}
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>

      <TeamFormModal
        isOpen={formOpen}
        key={editTeam?.id ?? 'new'}
        team={editTeam}
        onOpenChange={setFormOpen}
      />
      <ConfirmDialog
        confirmLabel='Supprimer l’équipe'
        description={
          <>
            L’équipe <strong>{deleteTeam?.name}</strong> sera supprimée. Ses
            membres ne seront pas supprimés : ils seront simplement détachés de
            l’équipe.
          </>
        }
        isOpen={deleteTeam !== null}
        title='Supprimer cette équipe ?'
        onConfirm={() => {
          toast.danger('Équipe supprimée', {
            description: `« ${deleteTeam?.name} » a été supprimée.`,
          });
          setDeleteTeam(null);
        }}
        onOpenChange={(open) => !open && setDeleteTeam(null)}
      />
    </>
  );
}

function NewTeamTileContent() {
  return (
    <>
      <span className='flex size-11 items-center justify-center rounded-full bg-default'>
        <Plus className='size-5' />
      </span>
      <span className='text-sm font-medium'>Nouvelle équipe</span>
    </>
  );
}

function TeamCardSkeleton() {
  return (
    <Card className='gap-4'>
      <Card.Header className='flex-row items-start justify-between gap-3'>
        <div className='flex min-w-0 flex-1 flex-col gap-2'>
          <Skeleton className='h-5 w-36 rounded-md' />
          <Skeleton className='h-3.5 w-full rounded-md' />
          <Skeleton className='h-3.5 w-2/3 rounded-md' />
        </div>
        <Skeleton className='size-8 shrink-0 rounded-lg' />
      </Card.Header>

      <Card.Content className='flex flex-col gap-4'>
        <div className='flex items-center justify-between'>
          <div className='flex -space-x-2'>
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton
                className='size-8 rounded-2xl ring-2 ring-surface'
                key={i}
              />
            ))}
          </div>
          <Skeleton className='h-5 w-20 rounded-2xl' />
        </div>

        {['w-32', 'w-28'].map((width) => (
          <div className='flex flex-col gap-2' key={width}>
            <div className='flex h-5 items-center justify-between'>
              <Skeleton className={`h-3.5 rounded-md ${width}`} />
              <Skeleton className='h-3.5 w-12 rounded-md' />
            </div>
            <Skeleton className='h-2 w-full rounded-sm' />
          </div>
        ))}
      </Card.Content>

      <Separator />

      <Card.Footer className='justify-between'>
        <div className='flex items-center gap-2'>
          <Skeleton className='size-8 rounded-2xl' />
          <div className='flex flex-col gap-1.5'>
            <Skeleton className='h-3 w-14 rounded-md' />
            <Skeleton className='h-3.5 w-24 rounded-md' />
          </div>
        </div>
        <Skeleton className='h-8 w-20 rounded-lg' />
      </Card.Footer>
    </Card>
  );
}
