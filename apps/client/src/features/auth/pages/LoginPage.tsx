import { useNavigate } from 'react-router-dom';
import LoginForm from '@/features/auth/components/LoginForm';
import LoginHero from '@/features/auth/components/LoginHero';

function LoginPage() {
  const navigate = useNavigate();

  const onSubmit = () => {
    navigate('/dashboard');
  };

  return (
    <div className='grid min-h-svh bg-background lg:grid-cols-[1.05fr_1fr]'>
      <LoginHero />
      <LoginForm onSignIn={onSubmit} />
    </div>
  );
}

export default LoginPage;
