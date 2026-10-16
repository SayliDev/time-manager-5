import { PageHeader } from '@/shared/ui/PageHeader';

export function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return <PageHeader description={description ?? 'WIP'} title={title} />;
}
