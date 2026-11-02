import { Chip } from '@heroui/react';

export function DemoBadge() {
  return (
    <Chip
      className='shrink-0'
      size='sm'
      title='Données fictives : cette information n’est pas encore fournie par l’API.'
      variant='soft'
    >
      <Chip.Label>Démo</Chip.Label>
    </Chip>
  );
}
