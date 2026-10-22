import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { tokenStorage } from '@/features/auth/api/tokenStorage';

export function useLogout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return () => {
    tokenStorage.clear();
    queryClient.clear();
    navigate('/');
  };
}
