import { Card, Link } from '@heroui/react';
import { EntriesTable } from '@/features/time/components/EntriesTable';
import { appPath } from '@/features/widgets/layout/nav';
import { useRecentEntries } from '../hooks/useRecentEntries';

interface RecentEntriesCardProps {
  userId: string | undefined;
}

export function RecentEntriesCard({ userId }: RecentEntriesCardProps) {
  const { data, isPending } = useRecentEntries(userId);

  return (
    <Card className='lg:col-span-2'>
      <Card.Header className='flex-row items-start justify-between gap-3'>
        <div>
          <Card.Title>Derniers pointages</Card.Title>
          <Card.Description>Vos 5 derniers pointages</Card.Description>
        </div>
        <Link href={appPath('/time')}>
          Tout voir
          <Link.Icon />
        </Link>
      </Card.Header>
      <Card.Content>
        <EntriesTable
          entries={data ?? []}
          isLoading={isPending}
          skeletonRows={5}
        />
      </Card.Content>
    </Card>
  );
}
