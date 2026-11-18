import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { tokenStorage } from '@/features/auth/api/tokenStorage';
import { request } from '@/shared/api/client';

export function useLogout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return async () => {
    await request<void>('/api/auth/logout', { method: 'POST', auth: false });
    tokenStorage.clear();
    queryClient.clear();
    navigate('/');
  };
}
