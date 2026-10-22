import { Spinner } from '@heroui/react';
import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { tokenStorage } from '@/features/auth/api/tokenStorage';
import { useSession } from '@/features/auth/hooks/useSession';

export function RequireAuth() {
  const session = useSession();

  useEffect(() => {
    if (session.isError) {
      tokenStorage.clear();
    }
  }, [session.isError]);

  if (session.isError) {
    return <Navigate replace to='/' />;
  }

  if (session.isPending) {
    return (
      <div className='flex min-h-svh items-center justify-center bg-background'>
        <Spinner aria-label='Vérification de la session' size='lg' />
      </div>
    );
  }

  return <Outlet />;
}
