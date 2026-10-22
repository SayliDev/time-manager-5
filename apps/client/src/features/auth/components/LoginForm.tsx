import type { FormEvent } from 'react';
import { useState } from 'react';
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
import { useLogin } from '@/features/auth/hooks/useLogin';
import { ApiError } from '@/shared/api/client';
import { Brand } from '@/shared/branding/Brand';
import { ThemeToggle } from '@/theme/ThemeToggle';
import MicrosoftSignInButton from './MicrosoftSignInButton';

type FieldErrors = {
  email?: string;
  password?: string;
};

export default function LoginForm() {
  const login = useLogin();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    setFormError(null);

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email');
    const password = formData.get('password');
    const nextFieldErrors: FieldErrors = {};

    if (typeof email !== 'string' || !email.trim()) {
      nextFieldErrors.email = 'Veuillez renseigner votre adresse email.';
    }

    if (typeof password !== 'string' || !password) {
      nextFieldErrors.password = 'Veuillez renseigner votre mot de passe.';
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    login.mutate(
      {
        email: (email as string).trim(),
        password: password as string,
      },
      {
        onError: (error) => {
          if (error instanceof ApiError && error.status === 401) {
            setFieldErrors({
              email: 'Email ou mot de passe incorrect.',
              password: 'Email ou mot de passe incorrect.',
            });
            return;
          }
          setFormError(
            error instanceof ApiError
              ? error.detail
              : 'Impossible de contacter le serveur.'
          );
        },
      }
    );
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
            isDisabled={login.isPending}
            size='lg'
            type='submit'
          >
            Se connecter
          </Button>
          {formError ? <FieldError>{formError}</FieldError> : null}
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
