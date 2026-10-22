import { Link } from 'react-router-dom';

export default function UnauthorizedPage() {
  return (
    <main className='flex min-h-svh items-center justify-center bg-background px-6'>
      <section className='w-full max-w-lg text-center'>
        <p className='text-sm font-medium text-muted'>Erreur 403</p>
        <h1 className='mt-3 text-3xl font-semibold text-foreground'>
          Accès non autorisé
        </h1>
        <p className='mt-3 text-sm text-muted'>
          Votre rôle ne vous permet pas d&apos;accéder à cette page.
        </p>
        <Link
          className='mt-8 inline-flex rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground'
          to='/'
        >
          Retour à la connexion
        </Link>
      </section>
    </main>
  );
}
