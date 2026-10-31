import { Card, Link } from '@heroui/react';
import { useTimeEntries } from '@/data/mockQueries';
import { EntriesTable } from '@/features/time/components/EntriesTable';
import { appPath } from '@/features/widgets/layout/nav';
import { DemoBadge } from '@/shared/ui/DemoBadge';

interface RecentEntriesCardProps {
  userId: string | undefined;
}

export function RecentEntriesCard({ userId }: RecentEntriesCardProps) {
  const { data, isPending } = useTimeEntries(userId);

  return (
    <Card className='lg:col-span-2'>
      <Card.Header className='flex-row items-start justify-between gap-3'>
        <div>
          <div className='flex items-center gap-2'>
            <Card.Title>Derniers pointages</Card.Title>
            <DemoBadge />
          </div>
          <Card.Description>Vos 5 dernières journées</Card.Description>
        </div>
        <Link href={appPath('/time')}>
          Tout voir
          <Link.Icon />
        </Link>
      </Card.Header>
      <Card.Content>
        <EntriesTable
          entries={(data ?? []).slice(0, 5)}
          isLoading={isPending}
          skeletonRows={5}
        />
      </Card.Content>
    </Card>
  );
}
