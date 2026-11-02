import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { queryClient } from '@/shared/api/queryClient';
import { AppToaster } from '@/shared/ui/AppToaster';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <AppToaster />
      <ReactQueryDevtools buttonPosition='bottom-right' initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>,
);
