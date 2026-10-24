import { Button } from '@heroui/react';
import { API_URL } from '@/shared/api/client';

function MicrosoftLogo() {
  return (
    <svg aria-hidden className='size-4' viewBox='0 0 23 23'>
      <path d='M1 1h10v10H1z' fill='#f25022' />
      <path d='M12 1h10v10H12z' fill='#7fba00' />
      <path d='M1 12h10v10H1z' fill='#00a4ef' />
      <path d='M12 12h10v10H12z' fill='#ffb900' />
    </svg>
  );
}

function MicrosoftSignInButton() {
  return (
    <Button
      className='mt-8 w-full'
      name='microsoft-sign-in'
      size='lg'
      variant='secondary'
      onPress={() => {
        window.location.href = `${API_URL}/api/auth/login/microsoft`;
      }}
    >
      <MicrosoftLogo />
      Continuer avec Microsoft
    </Button>
  );
}

export default MicrosoftSignInButton;
