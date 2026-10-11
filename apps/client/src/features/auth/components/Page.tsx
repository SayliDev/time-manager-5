import { Clock, Pulse, Shield, Persons } from '@gravity-ui/icons';
import {
  Button,
  Checkbox,
  FieldError,
  Form,
  Input,
  Label,
  Link,
  Separator,
  TextField,
} from '@heroui/react';
import { useNavigate } from 'react-router-dom';
import { Brand } from '@/shared/branding/Brand';
import { ThemeToggle } from '@/theme/ThemeToggle';

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

  const goToApp = () => {
    navigate('/dashboard');
  };

  return (
    <div className='grid min-h-svh bg-background lg:grid-cols-[1.05fr_1fr]'>
      {/* Panneau marque */}
      <aside className='tm-hero-bg relative hidden flex-col justify-between overflow-hidden p-12 text-white lg:flex'>
        <div className='flex items-center gap-2.5'>
          <span className='flex size-9 items-center justify-center rounded-lg bg-white/15 backdrop-blur'>
            <Clock className='size-5' />
          </span>
          <div className='leading-tight'>
            <p className='text-sm font-semibold'>Time Manager</p>
            <p className='text-[11px] font-medium uppercase tracking-wider text-white/60'>
              TrinityMarket
            </p>
          </div>
        </div>

        <div className='max-w-md'>
          <h2 className='text-4xl leading-[1.1] font-semibold tracking-tight'>
            Le temps de travail,{' '}
            <span className='text-white/60'>enfin clair.</span>
          </h2>
          <p className='mt-4 text-base text-white/70'>
            Sed ut perspiciatis unde omnis iste natus error sit voluptatem
          </p>

          <ul className='mt-10 flex flex-col gap-5'>
            {features.map(({ icon: Icon, title, text }) => (
              <li className='flex items-start gap-4' key={title}>
                <span className='flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15 backdrop-blur'>
                  <Icon className='size-5' />
                </span>
                <div>
                  <p className='text-sm font-medium'>{title}</p>
                  <p className='text-sm text-white/60'>{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className='flex items-center gap-2 text-xs text-white/50'>
          <Shield className='size-4' />
          Données chiffrées · Conforme RGPD · Authentification sécurisée
        </p>
      </aside>

      {/* Formulaire */}
      <main className='relative flex flex-col px-6 py-8 sm:px-12'>
        <div className='flex items-center justify-between lg:justify-end'>
          <div className='lg:hidden'>
            <Brand />
          </div>
          <ThemeToggle />
        </div>

        <div className='mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10'>
          <h1 className='text-3xl font-semibold tracking-tight'>Connexion</h1>
          <p className='mt-2 text-sm text-muted'>
            Entrez vos identifiants pour accéder à votre espace.
          </p>

          <Button
            className='mt-8 w-full'
            size='lg'
            variant='secondary'
            onPress={goToApp}
          >
            <MicrosoftLogo />
            Continuer avec Microsoft
          </Button>

          <div className='my-6 flex items-center gap-3 text-xs text-muted'>
            <Separator className='flex-1' />
            ou avec votre email
            <Separator className='flex-1' />
          </div>

          <Form
            className='flex flex-col gap-4'
            onSubmit={(e) => {
              e.preventDefault();
              goToApp();
            }}
          >
            <TextField isRequired name='email' type='email'>
              <Label>Email professionnel</Label>
              <Input
                autoComplete='username'
                placeholder='prenom.nom@trinitymarket.com'
              />
              <FieldError />
            </TextField>

            <TextField isRequired name='password' type='password'>
              <div className='flex items-center justify-between'>
                <Label>Mot de passe</Label>
                <Link className='text-xs' href='#'>
                  Mot de passe oublié ?
                </Link>
              </div>
              <Input
                autoComplete='current-password'
                placeholder='Votre mot de passe'
              />
              <FieldError />
            </TextField>

            <Checkbox name='remember'>
              <Checkbox.Content>
                <Checkbox.Control>
                  <Checkbox.Indicator />
                </Checkbox.Control>
                Rester connecté
              </Checkbox.Content>
            </Checkbox>

            <Button className='mt-2 w-full' size='lg' type='submit'>
              Se connecter
            </Button>
          </Form>

          <p className='mt-8 text-center text-xs text-muted'>
            Les comptes sont créés par votre manager.
            <br />
            Contactez-le pour obtenir un accès.
          </p>
        </div>

        <p className='text-center text-xs text-muted'>© 2026 Time Manager</p>
      </main>
    </div>
  );
}

export default Page;
