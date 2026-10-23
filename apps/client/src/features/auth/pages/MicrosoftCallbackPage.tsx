import { useQueryClient } from '@tanstack/react-query';
import { Spinner } from '@heroui/react';
import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { authQueryKeys } from '@/features/auth/api/authApi';
import { tokenStorage } from '@/features/auth/api/tokenStorage';

function readTokenFromHash(): string | null {
  return new URLSearchParams(window.location.hash.slice(1)).get('token');
}

function MicrosoftCallbackPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [token] = useState(readTokenFromHash);

  useEffect(() => {
    if (!token) {
      return;
    }
    tokenStorage.set(token);
    window.history.replaceState(null, '', window.location.pathname);
    queryClient
      .invalidateQueries({ queryKey: authQueryKeys.session })
      .finally(() => navigate('/dashboard', { replace: true }));
  }, [token, queryClient, navigate]);

  if (!token) {
    return <Navigate replace to='/' />;
  }

  return (
    <div className='flex min-h-svh items-center justify-center bg-background'>
      <Spinner aria-label='Connexion en cours' size='lg' />
    </div>
  );
}

export default MicrosoftCallbackPage;
