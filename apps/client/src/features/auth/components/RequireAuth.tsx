import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { tokenStorage } from '@/features/auth/api/tokenStorage';
import { useSession } from '@/features/auth/hooks/useSession';
import { AppLoader } from '@/shared/ui/AppLoader';

export function RequireAuth() {
  const token = tokenStorage.get();
  const session = useSession();

  useEffect(() => {
    if (session.isError) {
      tokenStorage.clear();
    }
  }, [session.isError]);

  if (!token || session.isError) {
    return <Navigate replace to='/' />;
  }

  if (session.isPending) {
    return <AppLoader />;
  }

  return <Outlet />;
}
