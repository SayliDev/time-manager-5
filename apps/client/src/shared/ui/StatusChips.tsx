import { CircleFill } from '@gravity-ui/icons';
import { Chip } from '@heroui/react';
import type { EntryStatus, WorkMode } from '@/features/time/types';
import { roleLabels } from '@/features/users/lib/names';
import type { PresenceStatus, Role } from '@/features/users/types';

type ChipColor = 'default' | 'accent' | 'success' | 'warning' | 'danger';

const presenceMap: Record<PresenceStatus, { label: string; color: ChipColor }> =
  {
    present: { label: 'Présentiel', color: 'success' },
    remote: { label: 'Distanciel', color: 'accent' },
    late: { label: 'En retard', color: 'warning' },
    absent: { label: 'Absent', color: 'danger' },
    off: { label: 'Congé', color: 'default' },
    unknown: { label: 'Non renseigné', color: 'default' },
  };

export function PresenceChip({ status }: { status: PresenceStatus }) {
  const { label, color } = presenceMap[status];
  return (
    <Chip color={color} size='sm' variant='soft'>
      <CircleFill width={6} />
      <Chip.Label>{label}</Chip.Label>
    </Chip>
  );
}

const entryMap: Record<EntryStatus, { label: string; color: ChipColor }> = {
  ok: { label: 'Conforme', color: 'success' },
  late: { label: 'Retard', color: 'warning' },
  overtime: { label: 'Heures sup.', color: 'accent' },
  missing: { label: 'Départ manquant', color: 'danger' },
  ongoing: { label: 'En cours', color: 'success' },
};

export function EntryStatusChip({ status }: { status: EntryStatus }) {
  const { label, color } = entryMap[status];
  return (
    <Chip color={color} size='sm' variant='soft'>
      <Chip.Label>{label}</Chip.Label>
    </Chip>
  );
}

const workModeMap: Record<WorkMode, { label: string; color: ChipColor }> = {
  onsite: { label: 'Présentiel', color: 'accent' },
  remote: { label: 'Distanciel', color: 'success' },
};

export function WorkModeChip({ mode }: { mode: WorkMode }) {
  const { label, color } = workModeMap[mode];
  return (
    <Chip color={color} size='sm' variant='soft'>
      <Chip.Label>{label}</Chip.Label>
    </Chip>
  );
}

const roleColors: Record<Role, ChipColor> = {
  admin: 'warning',
  manager: 'accent',
  employee: 'default',
};

export function RoleChip({ role }: { role: Role }) {
  return (
    <Chip color={roleColors[role]} size='sm' variant='soft'>
      <Chip.Label>{roleLabels[role]}</Chip.Label>
    </Chip>
  );
}
