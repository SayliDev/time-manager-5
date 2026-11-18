import { useState, type FormEvent } from 'react';
import { Button, Card, FieldError, Form, Input, Label, TextField } from '@heroui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { resetPassword } from '@/features/auth/api/authApi';
import { tokenStorage } from '@/features/auth/api/tokenStorage';
import { Brand } from '@/shared/branding/Brand';
import { ThemeToggle } from '@/theme/ThemeToggle';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [error, setError] = useState('');
  const queryClient = useQueryClient();
  const reset = useMutation({
    mutationFn: resetPassword,
    onSuccess: (data) => {
      queryClient.clear();
      tokenStorage.set(data.access_token);
    },
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const data = new FormData(event.currentTarget);
    const password = String(data.get('password') ?? '');
    if (password !== data.get('confirmation')) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (password.length < 8 || new TextEncoder().encode(password).length > 72) {
      setError('Utilisez au moins 8 caractères et au maximum 72 octets.');
      return;
    }
    if (!/\p{L}/u.test(password) || !/\p{Nd}/u.test(password)) {
      setError('Utilisez au moins une lettre et un chiffre.');
      return;
    }
    reset.mutate({ token, new_password: password });
  }

  return (
    <main className='min-h-screen bg-background px-6 py-8'>
      <div className='mx-auto flex max-w-5xl items-center justify-between'><Brand /><ThemeToggle /></div>
      <Card className='mx-auto mt-16 w-full max-w-md'>
        <Card.Header><h1 className='text-2xl font-semibold tracking-tight'>Nouveau mot de passe</h1></Card.Header>
        <Card.Content className='flex flex-col gap-5'>
          {reset.isSuccess ? <p role='status' className='text-sm text-success'>Votre mot de passe a été modifié. Vous êtes connecté.</p> : !token ? (
            <p role='alert' className='text-sm text-danger'>Le lien est incomplet. Demandez un nouveau lien depuis Mon compte.</p>
          ) : (
            <>
              <p className='text-sm text-muted'>Choisissez un mot de passe d’au moins 8 caractères avec une lettre et un chiffre (72 octets maximum).</p>
              <Form className='flex flex-col gap-4' onSubmit={submit}>
                <TextField isRequired name='password' type='password' minLength={8}>
                  <Label>Nouveau mot de passe</Label>
                  <Input name='password' autoComplete='new-password' />
                  <FieldError />
                </TextField>
                <TextField isRequired name='confirmation' type='password' minLength={8}>
                  <Label>Confirmer le mot de passe</Label>
                  <Input name='confirmation' autoComplete='new-password' />
                  <FieldError />
                </TextField>
                {(error || reset.isError) && <p role='alert' className='text-sm text-danger'>{error || reset.error?.message}</p>}
                <Button type='submit' isDisabled={reset.isPending}>{reset.isPending ? 'Enregistrement…' : 'Enregistrer le mot de passe'}</Button>
              </Form>
            </>
          )}
          <Link className='text-sm text-accent hover:underline' to={reset.isSuccess ? '/dashboard/profile' : '/'}>
            {reset.isSuccess ? 'Retour à mon compte' : 'Retour à la connexion'}
          </Link>
        </Card.Content>
      </Card>
    </main>
  );
}
