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

type FieldErrors = {
  email?: string;
  password?: string;
};

function LoginForm({ onSignIn }: { onSignIn: () => void }) {
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    setFormError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const username = formData.get('email');
    const password = formData.get('password');
    const nextFieldErrors: FieldErrors = {};

    if (typeof username !== 'string' || !username.trim()) {
      nextFieldErrors.email = 'Veuillez renseigner votre adresse email.';
    }

    if (typeof password !== 'string' || !password) {
      nextFieldErrors.password = 'Veuillez renseigner votre mot de passe.';
    }

    if (
      typeof username !== 'string' ||
      typeof password !== 'string' ||
      Object.keys(nextFieldErrors).length > 0
    ) {
      setFieldErrors(nextFieldErrors);
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
        setFieldErrors({
          email: 'Email ou mot de passe incorrect.',
          password: 'Email ou mot de passe incorrect.',
        });
        return;
      }

      const result: unknown = await response.json();

      if (
        typeof result !== 'object' ||
        result === null ||
        !('access_token' in result) ||
        typeof result.access_token !== 'string'
      ) {
        setFormError('La réponse du serveur est invalide.');
        return;
      }

      localStorage.setItem('access_token', result.access_token);
      onSignIn();
    } catch {
      setFormError('Impossible de contacter le serveur.');
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

        <MicrosoftSignInButton />

        <div className='my-6 flex items-center gap-3 text-xs text-muted'>
          <Separator className='flex-1' />
          ou avec votre email
          <Separator className='flex-1' />
        </div>

        <Form
          className='flex flex-col gap-4'
          onSubmit={handleSubmit}
          validationBehavior='aria'
        >
          <TextField
            isInvalid={Boolean(fieldErrors.email)}
            isRequired
            name='email'
            type='email'
          >
            <Label className='after:content-none'>Email professionnel</Label>
            <Input
              autoComplete='username'
              name='email'
              placeholder='prenom.nom@trinitymarket.com'
              onChange={() =>
                setFieldErrors((errors) => ({
                  ...errors,
                  email: undefined,
                  password: undefined,
                }))
              }
            />
            <FieldError>{fieldErrors.email}</FieldError>
          </TextField>

          <TextField
            isInvalid={Boolean(fieldErrors.password)}
            isRequired
            name='password'
            type='password'
          >
            <div className='flex items-center justify-between'>
              <Label>Mot de passe</Label>
              <Link className='text-xs' href='#'>
                Mot de passe oublié ?
              </Link>
            </div>
            <Input
              autoComplete='current-password'
              name='password'
              placeholder='Votre mot de passe'
              onChange={() =>
                setFieldErrors((errors) => ({
                  ...errors,
                  password: undefined,
                  email: undefined,
                }))
              }
            />
            <FieldError>{fieldErrors.password}</FieldError>
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
          {formError && <FieldError>{formError}</FieldError>}
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
