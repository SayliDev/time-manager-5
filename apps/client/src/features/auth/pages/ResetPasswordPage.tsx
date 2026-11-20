import { Eye, EyeSlash } from '@gravity-ui/icons';
import {
  Button,
  FieldError,
  Form,
  Input,
  Label,
  TextField,
} from '@heroui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
import { resetPassword } from '@/features/auth/api/authApi';
import { tokenStorage } from '@/features/auth/api/tokenStorage';
import LoginHero from '@/features/auth/components/LoginHero';
import {
  passwordError,
  passwordRules,
} from '@/features/auth/lib/passwordPolicy';
import { ApiError } from '@/shared/api/client';
import { Brand } from '@/shared/branding/Brand';
import { ThemeToggle } from '@/theme/ThemeToggle';

const RESET_TOKEN_KEY = 'tm-reset-token';
const TOKEN_MAX_LENGTH = 200;

type FieldErrors = {
  password?: string;
  confirmation?: string;
};

function readStoredToken(): string {
  return sessionStorage.getItem(RESET_TOKEN_KEY) ?? '';
}

function rememberToken(token: string) {
  sessionStorage.setItem(RESET_TOKEN_KEY, token);
}

function forgetToken() {
  sessionStorage.removeItem(RESET_TOKEN_KEY);
}

function resetFailure(error: unknown): string {
  if (error instanceof ApiError && error.status === 400) {
    return 'Ce lien est invalide ou a expiré. Demandez-en un nouveau depuis Mon compte.';
  }
  if (error instanceof ApiError && error.status === 422) {
    return 'Le mot de passe ne respecte pas les règles demandées.';
  }
  if (error instanceof ApiError) {
    return "Impossible d'enregistrer le mot de passe. Réessayez.";
  }
  return 'Impossible de contacter le serveur.';
}

function useTimedReveal(duration = 1000) {
  const [shown, setShown] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const toggle = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (shown) {
      setShown(false);
      return;
    }
    setShown(true);
    timer.current = setTimeout(() => {
      timer.current = null;
      setShown(false);
    }, duration);
  };

  return [shown, toggle] as const;
}

function PasswordVisibility({
  shown,
  onToggle,
  label,
}: {
  shown: boolean;
  onToggle: () => void;
  label: string;
}) {
  const Icon = shown ? EyeSlash : Eye;
  return (
    <Button
      isIconOnly
      aria-label={label}
      aria-pressed={shown}
      size='sm'
      type='button'
      variant='ghost'
      onPress={onToggle}
    >
      <Icon className='size-4' />
    </Button>
  );
}

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryToken = params.get('token');
  const [token, setToken] = useState(() => queryToken || readStoredToken());

  if (queryToken && queryToken !== token) {
    setToken(queryToken);
  }

  useEffect(() => {
    if (!queryToken) return;
    rememberToken(queryToken);
    const search = new URLSearchParams(location.search);
    search.delete('token');
    const remaining = search.toString();
    navigate(
      {
        pathname: location.pathname,
        search: remaining ? `?${remaining}` : '',
        hash: location.hash,
      },
      { replace: true },
    );
  }, [location.hash, location.pathname, location.search, navigate, queryToken]);

  return <ResetPasswordForm key={token} token={token} />;
}

function ResetPasswordForm({ token }: { token: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, togglePassword] = useTimedReveal();
  const [showConfirmation, toggleConfirmation] = useTimedReveal();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const tokenUsable = token.length > 0 && token.length <= TOKEN_MAX_LENGTH;
  const rules = passwordRules(password);
  const sameLength =
    confirmation.length > 0 && confirmation.length === password.length;
  const confirmationMatches = sameLength && confirmation === password;
  const confirmationError = !confirmation
    ? fieldErrors.confirmation
    : confirmationMatches
      ? null
      : 'Les mots de passe ne correspondent pas.';

  const reset = useMutation({
    mutationFn: resetPassword,
    onSuccess: (data) => {
      setPassword('');
      setConfirmation('');
      forgetToken();
      queryClient.clear();
      tokenStorage.set(data.access_token);
    },
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (reset.isPending || !tokenUsable) return;

    const nextErrors: FieldErrors = {};
    const policyError = passwordError(password);
    if (policyError) nextErrors.password = policyError;
    if (!confirmation) {
      nextErrors.confirmation = 'Veuillez confirmer le mot de passe.';
    } else if (confirmation !== password) {
      nextErrors.confirmation = 'Les mots de passe ne correspondent pas.';
    }

    setFieldErrors(nextErrors);
    setFormError(null);
    if (Object.keys(nextErrors).length > 0) return;

    reset.mutate(
      { token, new_password: password },
      {
        onError: (error) => {
          if (
            error instanceof ApiError &&
            (error.status === 400 || error.status === 422)
          ) {
            setPassword('');
            setConfirmation('');
          }
          setFormError(resetFailure(error));
        },
      },
    );
  }

  return (
    <div className='grid min-h-svh bg-background lg:grid-cols-[1.05fr_1fr]'>
      <LoginHero />
      <main className='relative flex flex-col px-6 py-8 sm:px-12'>
        <div className='flex items-center justify-between lg:justify-end'>
          <div className='lg:hidden'>
            <Brand />
          </div>
          <ThemeToggle />
        </div>

        <div className='mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10'>
          <h1 className='text-3xl font-semibold tracking-tight'>
            Nouveau mot de passe
          </h1>

          {reset.isSuccess ? (
            <div className='mt-6 flex flex-col gap-4'>
              <p className='text-sm text-success' role='status'>
                Votre mot de passe a été modifié. Vous êtes connecté.
              </p>
              <Button onPress={() => navigate('/dashboard')}>
                Accéder à mon espace
              </Button>
            </div>
          ) : !tokenUsable ? (
            <div className='mt-6 flex flex-col gap-4'>
              <p className='text-sm text-danger' role='alert'>
                Ce lien est incomplet. Ouvrez le lien reçu par email, ou
                demandez-en un nouveau depuis Mon compte. Il est valable 24
                heures et ne sert qu’une fois.
              </p>
              <Link className='text-sm text-accent hover:underline' to='/'>
                Retour à la connexion
              </Link>
            </div>
          ) : (
            <>
              <p className='mt-2 text-sm text-muted'>
                Choisissez un mot de passe pour votre compte.
              </p>

              <Form
                className='mt-8 flex flex-col gap-4'
                validationBehavior='aria'
                onSubmit={submit}
              >
                <TextField
                  isInvalid={Boolean(fieldErrors.password)}
                  isRequired
                  name='new-password'
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(value) => {
                    setPassword(value);
                    setFieldErrors((errors) => ({
                      ...errors,
                      password: undefined,
                    }));
                  }}
                >
                  <div className='flex items-center justify-between'>
                    <Label>Nouveau mot de passe</Label>
                    <PasswordVisibility
                      label={
                        showPassword
                          ? 'Masquer le mot de passe'
                          : 'Afficher le mot de passe'
                      }
                      shown={showPassword}
                      onToggle={togglePassword}
                    />
                  </div>
                  <Input
                    autoCapitalize='off'
                    autoComplete='new-password'
                    autoCorrect='off'
                    name='new-password'
                    spellCheck={false}
                  />
                  <FieldError>{fieldErrors.password}</FieldError>
                </TextField>

                <ul
                  aria-label='Règles du mot de passe'
                  className='flex flex-col gap-1 text-xs'
                >
                  {rules.map((rule) => (
                    <li
                      className={rule.met ? 'text-success' : 'text-muted'}
                      key={rule.id}
                    >
                      <span className='sr-only'>
                        {rule.met ? 'Respectée : ' : 'Manquante : '}
                      </span>
                      {rule.label}
                    </li>
                  ))}
                </ul>

                <TextField
                  isInvalid={Boolean(confirmationError)}
                  isRequired
                  name='confirm-password'
                  type={showConfirmation ? 'text' : 'password'}
                  value={confirmation}
                  onChange={setConfirmation}
                >
                  <div className='flex items-center justify-between'>
                    <Label>Confirmer le mot de passe</Label>
                    <PasswordVisibility
                      label={
                        showConfirmation
                          ? 'Masquer la confirmation'
                          : 'Afficher la confirmation'
                      }
                      shown={showConfirmation}
                      onToggle={toggleConfirmation}
                    />
                  </div>
                  <Input
                    autoCapitalize='off'
                    autoComplete='new-password'
                    autoCorrect='off'
                    name='confirm-password'
                    spellCheck={false}
                  />
                  <FieldError>{confirmationError}</FieldError>
                </TextField>
                {confirmationMatches ? (
                  <p
                    aria-live='polite'
                    className='text-sm text-success'
                    role='status'
                  >
                    Les mots de passe correspondent.
                  </p>
                ) : null}

                {formError ? (
                  <p className='text-sm text-danger' role='alert'>
                    {formError}
                  </p>
                ) : null}

                <Button
                  className='mt-2 w-full'
                  isDisabled={reset.isPending}
                  size='lg'
                  type='submit'
                >
                  {reset.isPending
                    ? 'Enregistrement…'
                    : 'Enregistrer le mot de passe'}
                </Button>
              </Form>

              <Link
                className='mt-8 text-center text-sm text-accent hover:underline'
                to='/'
              >
                Retour à la connexion
              </Link>
            </>
          )}
        </div>

        <p className='text-center text-xs text-muted'>© 2026 Time Manager</p>
      </main>
    </div>
  );
}
