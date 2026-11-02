import { Toaster } from 'sileo';
import { useDocumentTheme } from '@/theme/useDocumentTheme';

const toastStyles = {
  light: { sileoTheme: 'dark', fill: '#ffffff' },
  dark: { sileoTheme: 'light', fill: '#1c1c1f' },
} as const;

export function AppToaster() {
  const { sileoTheme, fill } = toastStyles[useDocumentTheme()];

  return (
    <Toaster options={{ fill }} position='top-center' theme={sileoTheme} />
  );
}
