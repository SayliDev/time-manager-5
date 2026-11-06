import { Button, Card, Chip } from '@heroui/react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { authQueryKeys, getMyManagers, requestPasswordReset } from '@/features/auth/api/authApi';
import { formatDateTime } from '@/shared/lib/format';
import { PageHeader } from '@/shared/ui/PageHeader';
import { UserAvatar } from '@/shared/ui/UserAvatar';

const capitalizeName = (name: string) =>
  name.charAt(0).toLocaleUpperCase('fr-FR') + name.slice(1);

export function AccountPage() {
  const { data: user, isPending, isError, refetch } = useCurrentUser();
  const reset = useMutation({ mutationFn: requestPasswordReset });

  const managers = useQuery({
    queryKey: [...authQueryKeys.session, 'managers', user?.id],
    queryFn: getMyManagers,
    enabled: user?.role === 'employee',
  });

  return (
    <>
      <PageHeader title='Mon compte' description='Retrouvez vos informations personnelles et gérez la sécurité de votre compte.' />
      {isPending ? <p role='status' className='text-sm text-muted'>Chargement de votre profil…</p> : isError || !user ? (
        <Card><Card.Content className='flex flex-col items-start gap-3'>
          <p role='alert'>Impossible de charger votre profil.</p>
          <Button variant='secondary' onPress={() => { void refetch(); }}>Réessayer</Button>
        </Card.Content></Card>
      ) : (
        <div className='grid gap-6 lg:grid-cols-3'>
          <Card className='lg:col-span-2'>
            <Card.Header className='flex flex-row items-center gap-4'>
              <UserAvatar user={user} size='lg' />
              <div className='min-w-0'>
                <h2 className='text-lg font-semibold'>{capitalizeName(user.firstName)} {capitalizeName(user.lastName)}</h2>
                <p className='break-all text-sm text-muted'>{user.email}</p>
              </div>
            </Card.Header>
            <Card.Content>
              <dl className='grid gap-6 border-t border-separator pt-6 sm:grid-cols-2'>
                {[[ 'Prénom', capitalizeName(user.firstName) ], [ 'Nom', capitalizeName(user.lastName) ], [ 'Matricule', user.id ], [ 'Compte créé le', formatDateTime(user.createdAt) ]].map(([label, value]) => (
                  <div key={label} className='min-w-0'>
                    <dt className='text-sm text-muted'>{label}</dt>
                    <dd className='mt-1 break-words font-medium'>{value}</dd>
                  </div>
                ))}
              </dl>
              {user.role === 'employee' && (
                <section className='mt-6 border-t border-separator pt-6' aria-labelledby='manager-title'>
                  <h3 id='manager-title' className='text-sm font-medium'>
                    {managers.data && managers.data.length > 1 ? 'Vos managers' : 'Votre manager'}
                  </h3>
                  {managers.isPending ? (
                    <p role='status' className='mt-2 text-sm text-muted'>Chargement de votre manager…</p>
                  ) : managers.isError ? (
                    <div className='mt-2 flex flex-col items-start gap-2'>
                      <p role='alert' className='text-sm text-danger'>Impossible de charger votre manager.</p>
                      <Button size='sm' variant='secondary' onPress={() => { void managers.refetch(); }}>Réessayer</Button>
                    </div>
                  ) : managers.data?.length ? (
                    <ul className='mt-3 flex flex-col gap-4'>
                      {managers.data.map((manager) => (
                        <li key={manager.id_user} className='flex items-center gap-3'>
                          <UserAvatar user={{ id: String(manager.id_user), firstName: manager.first_name, lastName: manager.last_name }} />
                          <div className='min-w-0'>
                            <p className='font-medium'>{capitalizeName(manager.first_name)} {capitalizeName(manager.last_name)}</p>
                            <a href={`mailto:${manager.email}`} className='break-all text-sm text-accent hover:underline'>{manager.email}</a>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className='mt-2 text-sm text-muted'>Aucun manager attribué pour le moment.</p>
                  )}
                </section>
              )}
            </Card.Content>
          </Card>
          <Card>
            <Card.Header><h2 className='text-lg font-semibold'>Sécurité</h2></Card.Header>
            <Card.Content className='flex flex-col items-start gap-4'>
              <div>
                <h3 className='text-sm font-medium'>Mot de passe</h3>
                <Chip className='mt-2 h-auto max-w-full py-1' color='accent' size='sm' variant='soft'>
                  <Chip.Label className='whitespace-normal'>
                    Dernière définition : {formatDateTime(user.passwordSetAt)}
                  </Chip.Label>
                </Chip>
                <p className='mt-2 text-sm text-muted'>Recevez un lien sur votre boîte mail pour choisir un nouveau mot de passe. Ce lien est valable 24 heures.</p>
              </div>
              <Button className='h-auto min-h-10 whitespace-normal py-2' isDisabled={reset.isPending || reset.isSuccess} onPress={() => reset.mutate()}>
                {reset.isPending ? 'Envoi en cours…' : reset.isSuccess ? 'Email envoyé' : 'Réinitialiser mon mot de passe'}
              </Button>
              {reset.isSuccess && <p role='status' className='text-sm text-success'>Consultez votre boîte mail, y compris les courriers indésirables.</p>}
              {reset.isError && <p role='alert' className='text-sm text-danger'>{reset.error.message || "Impossible d'envoyer l'email. Réessayez."}</p>}
            </Card.Content>
          </Card>
        </div>
      )}
    </>
  );
}
