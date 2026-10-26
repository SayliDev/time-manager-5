import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
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
import { useSession } from '@/features/auth/hooks/useSession';
import { ApiError, request } from '@/shared/api/client';
import { PageHeader } from '@/shared/ui/PageHeader';

type LeaveStatus = 'pending' | 'approved' | 'rejected';
type LeaveType = 'conge' | 'maladie' | 'rtt';

type LeaveRequest = {
  id_leave_request: number;
  id_user: number;
  first_name?: string;
  last_name?: string;
  start_at: string;
  return_at: string;
  reason: string | null;
  leave_type: LeaveType;
  status: LeaveStatus;
  decision_comment: string | null;
  processor_first_name?: string | null;
  processor_last_name?: string | null;
  team_id?: number | null;
  team_name?: string | null;
};

function formatDate(value: string) {
  return new Date(value).toLocaleString('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function toIso(value: FormDataEntryValue | null) {
  if (typeof value !== 'string' || !value) {
    throw new Error('Les deux dates sont obligatoires.');
  }
  return new Date(value).toISOString();
}

const statusLabels: Record<LeaveStatus, string> = {
  pending: 'En attente',
  approved: 'Approuvé',
  rejected: 'Refusé',
};

const leaveTypeLabels: Record<LeaveType, string> = {
  conge: 'Congé',
  maladie: 'Maladie',
  rtt: 'RTT',
};

const REJECTION_FORM_ID = 'leave-rejection-form';

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function calendarDays(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const mondayOffset = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - mondayOffset);
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

function leaveTouchesDay(leave: LeaveRequest, day: Date) {
  const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  return new Date(leave.start_at) < dayEnd && new Date(leave.return_at) > dayStart;
}

export function LeavePage() {
  const session = useSession();
  const isManager = session.data?.role === 'admin' || session.data?.role === 'manager';
  const currentUserId = session.data?.id ? Number(session.data.id) : null;
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leaveType, setLeaveType] = useState<LeaveType>('conge');
  const [teamId, setTeamId] = useState('all');
  const [userId, setUserId] = useState('all');
  const [view, setView] = useState<'list' | 'calendar'>('calendar');
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [rejectingRequest, setRejectingRequest] = useState<LeaveRequest | null>(null);
  const [isDecisionSubmitting, setIsDecisionSubmitting] = useState(false);

  const teamOptions = useMemo(
    () =>
      Array.from(
        new Map(
          requests
            .filter((leave) => leave.team_id && leave.team_name)
            .map((leave) => [String(leave.team_id), leave.team_name as string])
        )
      ),
    [requests]
  );
  const userOptions = useMemo(
    () =>
      Array.from(
        new Map(
          requests.map((leave) => [
            String(leave.id_user),
            `${leave.first_name ?? ''} ${leave.last_name ?? ''}`.trim(),
          ])
        )
      ),
    [requests]
  );
  const days = useMemo(() => calendarDays(currentMonth), [currentMonth]);

  useEffect(() => {
    if (session.data) {
      setView('calendar');
    }
  }, [isManager, session.data]);

  async function loadRequests() {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (teamId !== 'all') params.set('team_id', teamId);
      if (userId !== 'all') params.set('user_id', userId);
      const query = params.toString();
      const path = `/api/leave-requests${query ? `?${query}` : ''}`;
      setRequests(await request<LeaveRequest[]>(path));
    } catch (error) {
      toast.danger('Chargement impossible', {
        description: error instanceof ApiError ? error.detail : 'Erreur serveur.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (session.data) {
      void loadRequests();
    }
  }, [session.data, teamId, userId]);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    const form = new FormData(event.currentTarget);
    try {
      await request<LeaveRequest>('/api/leave-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_at: toIso(form.get('start_at')),
          return_at: toIso(form.get('return_at')),
          reason: form.get('reason') || null,
          leave_type: leaveType,
        }),
      });
      event.currentTarget.reset();
      setLeaveType('conge');
      toast.success('Demande envoyée', {
        description: 'Votre demande est en attente de validation.',
      });
      await loadRequests();
    } catch (error) {
      toast.danger('Demande impossible', {
        description: error instanceof ApiError ? error.detail : (error as Error).message,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function decide(
    id: number,
    status: 'approved' | 'rejected',
    decisionComment: string | null = null,
  ) {
    setIsDecisionSubmitting(true);
    try {
      await request(`/api/leave-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, decision_comment: decisionComment }),
      });
      toast.success(status === 'approved' ? 'Congé approuvé' : 'Congé refusé');
      setRejectingRequest(null);
      await loadRequests();
    } catch (error) {
      toast.danger('Action impossible', {
        description: error instanceof ApiError ? error.detail : 'Erreur serveur.',
      });
    } finally {
      setIsDecisionSubmitting(false);
    }
  }

  async function handleReject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!rejectingRequest) return;

    const comment = String(new FormData(event.currentTarget).get('decision_comment') ?? '').trim();
    if (!comment) return;
    await decide(rejectingRequest.id_leave_request, 'rejected', comment);
  }

  return (
    <main className='min-h-svh bg-background px-6 py-8 sm:px-10'>
      <PageHeader
        description='Demandez une absence et suivez sa validation.'
        title='Congés et absences'
      />

      {isManager ? (
        <div className='mx-auto mb-6 flex max-w-6xl flex-wrap items-end gap-3'>
          <Select
            aria-label='Filtrer par équipe'
            className='w-56'
            value={teamId}
            onChange={(value) => {
              setTeamId(String(value));
              setUserId('all');
            }}
          >
            <Label>Équipe dirigée</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBox.Item id='all' textValue='Toutes les équipes'>
                  Toutes les équipes
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                {teamOptions.map(([id, name]) => (
                  <ListBox.Item id={id} key={id} textValue={name}>
                    {name}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
          <Select
            aria-label='Filtrer par utilisateur'
            className='w-56'
            value={userId}
            onChange={(value) => setUserId(String(value))}
          >
            <Label>Utilisateur</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBox.Item id='all' textValue='Tous les utilisateurs'>
                  Tous les utilisateurs
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                {userOptions.map(([id, name]) => (
                  <ListBox.Item id={id} key={id} textValue={name}>
                    {name}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
          <div className='flex gap-2'>
            <Button
              size='sm'
              variant={view === 'calendar' ? 'primary' : 'tertiary'}
              onPress={() => setView('calendar')}
            >
              Calendrier
            </Button>
            <Button
              size='sm'
              variant={view === 'list' ? 'primary' : 'tertiary'}
              onPress={() => setView('list')}
            >
              Liste
            </Button>
          </div>
        </div>
      ) : null}

      <div className='mx-auto grid max-w-6xl gap-4 lg:grid-cols-[minmax(260px,320px)_1fr]'>
        <Card className='self-start'>
          <Card.Header>
            <Card.Title>Nouvelle demande</Card.Title>
          </Card.Header>
          <Card.Content>
            <Form className='flex flex-col gap-3' onSubmit={handleCreate}>
              <Select
                aria-label="Type d'absence"
                isRequired
                value={leaveType}
                onChange={(value) => setLeaveType(String(value) as LeaveType)}
              >
                <Label>Type d'absence</Label>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {(Object.entries(leaveTypeLabels) as [LeaveType, string][]).map(
                      ([id, label]) => (
                        <ListBox.Item id={id} key={id} textValue={label}>
                          {label}
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      )
                    )}
                  </ListBox>
                </Select.Popover>
              </Select>              <TextField isRequired name='start_at' type='datetime-local'>
                <Label>Date de départ</Label>
                <Input />
              </TextField>
              <TextField isRequired name='return_at' type='datetime-local'>
                <Label>Date de retour</Label>
                <Input />
              </TextField>
              <TextField name='reason'>
                <Label>Motif</Label>
                <Input placeholder='Motif facultatif' />
              </TextField>
              <Button isDisabled={isSubmitting} type='submit'>
                Envoyer la demande
              </Button>
            </Form>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>{isManager ? 'Demandes à traiter' : 'Demandes de mon équipe'}</Card.Title>
          </Card.Header>
          <Card.Content>
            {isManager && requests.some(
              (leave) => leave.status === 'pending' && leave.id_user === currentUserId
            ) ? (
              <p className='mb-4 text-sm text-muted' role='note'>
                Vous ne pouvez pas valider ou refuser vos propres demandes.
                Un autre manager de votre équipe ou un administrateur doit les traiter.
                Les boutons Valider et Refuser apparaissent sur les demandes en attente des autres utilisateurs.
              </p>
            ) : null}
            {isLoading ? (
              <p className='text-sm text-muted'>Chargement des demandes…</p>
            ) : view === 'calendar' ? (
              <div>
                <div className='mb-4 flex items-center justify-between'>
                  <Button
                    size='sm'
                    variant='tertiary'
                    onPress={() =>
                      setCurrentMonth(
                        (month) => new Date(month.getFullYear(), month.getMonth() - 1, 1)
                      )
                    }
                  >
                    Mois précédent
                  </Button>
                  <h2 className='font-semibold capitalize'>
                    {currentMonth.toLocaleDateString('fr-FR', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </h2>
                  <Button
                    size='sm'
                    variant='tertiary'
                    onPress={() =>
                      setCurrentMonth(
                        (month) => new Date(month.getFullYear(), month.getMonth() + 1, 1)
                      )
                    }
                  >
                    Mois suivant
                  </Button>
                </div>
                <div className='grid grid-cols-7 border-l border-t border-separator'>
                  {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
                    <div className='border-r border-b border-separator p-2 text-xs font-medium text-muted' key={day}>
                      {day}
                    </div>
                  ))}
                  {days.map((day) => {
                    const events = requests.filter((leave) => leaveTouchesDay(leave, day));
                    const inMonth = day.getMonth() === currentMonth.getMonth();
                    return (
                      <div className={`min-h-28 border-r border-b border-separator p-2 ${inMonth ? '' : 'bg-default/30'}`} key={dateKey(day)}>
                        <p className={`text-xs ${inMonth ? 'text-foreground' : 'text-muted'}`}>
                          {day.getDate()}
                        </p>
                        <div className='mt-1 flex flex-col gap-1'>
                          {events.map((leave) => (
                            <div
                              className='rounded bg-accent-soft p-1'
                              key={leave.id_leave_request}
                            >
                              <p
                                className='truncate text-xs text-accent-soft-foreground'
                                title={`${leave.first_name ?? 'Vous'} - ${leaveTypeLabels[leave.leave_type]} - ${statusLabels[leave.status]}`}
                              >
                                {isManager ? leave.first_name : 'Absence'} · {leaveTypeLabels[leave.leave_type]} · {statusLabels[leave.status]}
                              </p>
                              {isManager &&
                              leave.status === 'pending' &&
                              currentUserId !== null &&
                              leave.id_user !== currentUserId ? (
                                <div className='mt-1 flex flex-wrap gap-1'>
                                  <Button
                                    aria-label={`Valider la demande de ${leave.first_name ?? ''} ${leave.last_name ?? ''}`}
                                    isDisabled={isDecisionSubmitting}
                                    size='sm'
                                    onPress={() => void decide(leave.id_leave_request, 'approved')}
                                  >
                                    Valider
                                  </Button>
                                  <Button
                                    aria-label={`Refuser la demande de ${leave.first_name ?? ''} ${leave.last_name ?? ''}`}
                                    isDisabled={isDecisionSubmitting}
                                    size='sm'
                                    variant='danger'
                                    onPress={() => setRejectingRequest(leave)}
                                  >
                                    Refuser
                                  </Button>
                                </div>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {isManager ? (
                  <div className='mt-6 border-t border-separator pt-4'>
                    <h3 className='mb-3 font-semibold'>Demandes à traiter</h3>
                    <div className='flex flex-col divide-y divide-separator'>
                      {requests.filter((leave) => leave.status === 'pending').map((leave) => (
                        <div className='flex items-center justify-between gap-3 py-3' key={leave.id_leave_request}>
                          <div>
                            <p className='font-medium'>
                              {leave.first_name} {leave.last_name}
                            </p>
                            <p className='text-sm text-muted'>
                              {formatDate(leave.start_at)} → {formatDate(leave.return_at)}
                            </p>
                          </div>
                          {currentUserId !== null && leave.id_user !== currentUserId ? (
                            <div className='flex shrink-0 gap-2'>
                              <Button
                                isDisabled={isDecisionSubmitting}
                                size='sm'
                                onPress={() => void decide(leave.id_leave_request, 'approved')}
                              >
                                Valider
                              </Button>
                              <Button
                                isDisabled={isDecisionSubmitting}
                                size='sm'
                                variant='danger'
                                onPress={() => setRejectingRequest(leave)}
                              >
                                Refuser
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : requests.length === 0 ? (
              <p className='text-sm text-muted'>Aucune demande de congé.</p>
            ) : (
              <div className='flex flex-col divide-y divide-separator'>
                {requests.map((leave) => (
                  <article className='flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between' key={leave.id_leave_request}>
                    <div>
                      <p className='font-medium text-foreground'>
                        {isManager ? `${leave.first_name} ${leave.last_name}` : 'Votre demande'}
                      </p>
                      <p className='text-sm text-muted'>
                        {formatDate(leave.start_at)} → {formatDate(leave.return_at)}
                      </p>
                      {leave.reason ? <p className='text-sm text-muted'>{leave.reason}</p> : null}
                      {leave.decision_comment ? (
                        <p className='text-sm text-muted'>Décision : {leave.decision_comment}</p>
                      ) : null}
                    </div>
                    <div className='flex items-center gap-2'>
                      <span className='text-sm font-medium'>
                        {leaveTypeLabels[leave.leave_type]} · {statusLabels[leave.status]}
                      </span>
                      {isManager &&
                      leave.status === 'pending' &&
                      currentUserId !== null && leave.id_user !== currentUserId ? (
                        <>
                          <Button
                            isDisabled={isDecisionSubmitting}
                            size='sm'
                            onPress={() => void decide(leave.id_leave_request, 'approved')}
                          >
                            Valider
                          </Button>
                          <Button
                            isDisabled={isDecisionSubmitting}
                            size='sm'
                            variant='danger'
                            onPress={() => setRejectingRequest(leave)}
                          >
                            Refuser
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </Card.Content>
        </Card>
      </div>

      <Modal.Backdrop
        isOpen={rejectingRequest !== null}
        variant='blur'
        onOpenChange={(isOpen) => {
          if (!isOpen && !isDecisionSubmitting) setRejectingRequest(null);
        }}
      >
        <Modal.Container>
          <Modal.Dialog className='sm:max-w-[460px]'>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Refuser la demande</Modal.Heading>
              <p className='text-sm text-muted'>Indiquez le motif du refus.</p>
            </Modal.Header>
            <Modal.Body>
              <Form id={REJECTION_FORM_ID} onSubmit={handleReject}>
                <TextField isRequired name='decision_comment'>
                  <Label>Motif du refus</Label>
                  <TextArea autoFocus placeholder='Expliquez la décision…' />
                </TextField>
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button
                isDisabled={isDecisionSubmitting}
                slot='close'
                variant='tertiary'
              >
                Annuler
              </Button>
              <Button
                form={REJECTION_FORM_ID}
                isDisabled={isDecisionSubmitting}
                type='submit'
                variant='danger'
              >
                Refuser
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </main>
  );
}
