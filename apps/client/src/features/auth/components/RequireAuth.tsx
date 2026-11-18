import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { tokenStorage } from '@/features/auth/api/tokenStorage';
import { useSession } from '@/features/auth/hooks/useSession';
import { AppLoader } from '@/shared/ui/AppLoader';

export function RequireAuth() {
  const location = useLocation();
  const session = useSession();

  useEffect(() => {
    if (session.isError) {
      tokenStorage.clear();
    }
  }, [session.isError]);

  if (session.isError) {
    return (
      <Navigate
        replace
        to='/'
        state={{
          message: 'Votre session est absente ou invalide. Veuillez vous reconnecter.',
          from: location.pathname,
        }}
      />
    );
  }

  if (session.isPending) {
    return <AppLoader />;
  }

  return <Outlet />;
}
