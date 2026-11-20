export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_BYTES = 72;

const letter = /^\p{L}$/u;
const digit = /^\p{Nd}$/u;

export interface PasswordRule {
  id: 'length' | 'letter' | 'digit' | 'bytes';
  label: string;
  met: boolean;
}

export function passwordByteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

export function passwordRules(value: string): PasswordRule[] {
  const characters = [...value];
  return [
    {
      id: 'length',
      label: `${PASSWORD_MIN_LENGTH} caractères minimum`,
      met: value.length >= PASSWORD_MIN_LENGTH,
    },
    {
      id: 'letter',
      label: 'Au moins une lettre',
      met: characters.some((character) => letter.test(character)),
    },
    {
      id: 'digit',
      label: 'Au moins un chiffre',
      met: characters.some((character) => digit.test(character)),
    },
    {
      id: 'bytes',
      label: `${PASSWORD_MAX_BYTES} octets maximum`,
      met: passwordByteLength(value) <= PASSWORD_MAX_BYTES,
    },
  ];
}

/** Première règle non respectée, dans le même ordre que l'API. */
export function passwordError(value: string): string | null {
  if (!value) return 'Veuillez choisir un mot de passe.';
  if (value.length < PASSWORD_MIN_LENGTH) {
    return `Utilisez au moins ${PASSWORD_MIN_LENGTH} caractères.`;
  }
  const characters = [...value];
  const hasLetter = characters.some((character) => letter.test(character));
  const hasDigit = characters.some((character) => digit.test(character));
  if (!hasLetter || !hasDigit) {
    return 'Utilisez au moins une lettre et un chiffre.';
  }
  if (passwordByteLength(value) > PASSWORD_MAX_BYTES) {
    return `${PASSWORD_MAX_BYTES} octets maximum.`;
  }
  return null;
}
