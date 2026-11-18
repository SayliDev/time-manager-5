import { Spinner } from '@heroui/react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSession } from '@/features/auth/hooks/useSession';

type RequireRolesProps = {
  roles: readonly string[];
};

export function RequireRoles({ roles }: RequireRolesProps) {
  const session = useSession();

  if (session.isPending) {
    return (
      <div className='flex min-h-svh items-center justify-center bg-background'>
        <Spinner aria-label='Vérification du rôle' size='lg' />
      </div>
    );
  }

  if (session.isError || !session.data) {
    return <Navigate replace to='/' />;
  }

  if (!roles.includes(session.data.role)) {
    return <Navigate replace to='/unauthorized' />;
  }

  return <Outlet />;
}
