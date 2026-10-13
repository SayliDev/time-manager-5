import { Clock, Persons, Pulse } from '@gravity-ui/icons';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/LoginForm';
import LoginHero from '../components/LoginHero';

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

const features = [
  {
    icon: Clock,
    title: 'Pointage en un clic',
    text: 'Arrivées et départs enregistrés en quelques secondes.',
  },
  {
    icon: Pulse,
    title: 'KPIs en temps réel',
    text: 'Présence, heures et ponctualité à portée de main.',
  },
  {
    icon: Persons,
    title: 'Gestion d’équipes',
    text: 'Organisez vos collaborateurs et suivez leur charge.',
  },
];

function Page() {
  const navigate = useNavigate();

  const onSubmit = () => {
    navigate('/dashboard');
  };

  return (
    <div className='grid min-h-svh bg-background lg:grid-cols-[1.05fr_1fr]'>
      <LoginHero features={features} />
      <LoginForm MicrosoftLogo={MicrosoftLogo} onSubmit={onSubmit} />
    </div>
  );
}

export default Page;
