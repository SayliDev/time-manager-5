import { Button } from '@heroui/react';

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
        size='lg'
        variant='secondary'
        name='microsoft-sign-in'
        onClick={() => handleLogin()}
      >
        <MicrosoftLogo />
        Continuer avec Microsoft
      </Button>
  );
}

function handleLogin() {
  window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/login/microsoft`;
}

export default MicrosoftSignInButton;