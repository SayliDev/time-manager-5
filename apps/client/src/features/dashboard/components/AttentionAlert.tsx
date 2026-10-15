import { Alert, Button, toast } from '@heroui/react';

interface AttentionAlertProps {
  lateCount: number;
  absentCount: number;
}

export function AttentionAlert({ lateCount, absentCount }: AttentionAlertProps) {
  const alerts = lateCount + absentCount;
  if (alerts === 0) return null;

  return (
    <Alert status='warning'>
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>
          {alerts} point{alerts > 1 ? 's' : ''} d’attention aujourd’hui
        </Alert.Title>
        <Alert.Description>
          {lateCount} retard{lateCount > 1 ? 's' : ''} et {absentCount} absence
          {absentCount > 1 ? 's' : ''} non justifiée
          {absentCount > 1 ? 's' : ''} détecté
          {alerts > 1 ? 's' : ''} sur la période.
        </Alert.Description>
      </Alert.Content>
      <Button
        size='sm'
        variant='tertiary'
        onPress={() => toast.info('Rappel envoyé aux employés concernés')}
      >
        Envoyer un rappel
      </Button>
    </Alert>
  );
}
