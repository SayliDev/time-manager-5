import { Spinner } from '@heroui/react';
import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import LoginForm from '@/features/auth/components/LoginForm';
import LoginHero from '@/features/auth/components/LoginHero';
import { tokenStorage } from '@/features/auth/api/tokenStorage';
import { useSession } from '@/features/auth/hooks/useSession';

function LoginPage() {
  const token = tokenStorage.get();
  const session = useSession();

  useEffect(() => {
    if (session.isError) {
      tokenStorage.clear();
    }
  }, [session.isError]);

  if (token && session.isPending) {
    return (
      <div className='flex min-h-svh items-center justify-center bg-background'>
        <Spinner aria-label='Vérification de la session' size='lg' />
      </div>
    );
  }

  if (token && session.isSuccess) {
    return <Navigate replace to='/dashboard' />;
  }

  return (
    <div className='grid min-h-svh bg-background lg:grid-cols-[1.05fr_1fr]'>
      <LoginHero />
      <LoginForm />
    </div>
  );
}

export default LoginPage;
