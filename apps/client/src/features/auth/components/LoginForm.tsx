import { useState } from 'react';
import type { FormEvent } from 'react';
import { Brand } from '@/shared/branding/Brand';
import { ThemeToggle } from '@/theme/ThemeToggle';
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
import MicrosoftSignInButton from './MicrosoftSignInButton';

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8001';

function LoginForm({ onSignIn }: { onSignIn: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const username = formData.get('email');
    const password = formData.get('password');

    if (typeof username !== 'string' || typeof password !== 'string') {
      setError('Veuillez renseigner votre email et votre mot de passe.');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ username, password }),
      });

      if (!response.ok) {
        setError('Identifiants invalides.');
        return;
      }

      const result: unknown = await response.json();

      if (
        typeof result !== 'object' ||
        result === null ||
        !('access_token' in result) ||
        typeof result.access_token !== 'string'
      ) {
        setError('Réponse de connexion invalide.');
        return;
      }

      localStorage.setItem('access_token', result.access_token);
      onSignIn();
    } catch {
      setError('Impossible de contacter le serveur.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
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

        <MicrosoftSignInButton onSignIn={onSignIn} />

        <div className='my-6 flex items-center gap-3 text-xs text-muted'>
          <Separator className='flex-1' />
          ou avec votre email
          <Separator className='flex-1' />
        </div>

        <Form
          className='flex flex-col gap-4'
          onSubmit={handleSubmit}
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

          <Button
            className='mt-2 w-full'
            isDisabled={isSubmitting}
            size='lg'
            type='submit'
          >
            Se connecter
          </Button>
          {error && <FieldError>{error}</FieldError>}
        </Form>

        <p className='mt-8 text-center text-xs text-muted'>
          Les comptes sont créés par votre manager.
          <br />
          Contactez-le pour obtenir un accès.
        </p>
      </div>

      <p className='text-center text-xs text-muted'>© 2026 Time Manager</p>
    </main>
  );
}

export default LoginForm;
