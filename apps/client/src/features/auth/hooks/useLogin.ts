import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authQueryKeys, login } from '@/features/auth/api/authApi';
import { tokenStorage } from '@/features/auth/api/tokenStorage';
import type { LoginCredentials } from '@/features/auth/types';

export function useLogin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => login(credentials),
    onSuccess: async (data) => {
      tokenStorage.set(data.access_token);
      await queryClient.invalidateQueries({ queryKey: authQueryKeys.session });
      navigate('/dashboard');
    },
  });
}
