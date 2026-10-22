import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { RequireAuth } from '@/features/auth/components/RequireAuth';
import LoginPage from '@/features/auth/pages/LoginPage';
import MicrosoftCallbackPage from '@/features/auth/pages/MicrosoftCallbackPage';
import { ManagerDashboardPage } from '@/features/dashboard/pages/ManagerDashboardPage';
import { TimePage } from '@/features/time/pages/TimePage';
import { UsersPage } from '@/features/users/pages/UsersPage';
import { AppShell } from '@/features/widgets/layout/AppShell';
import { PlaceholderPage } from '@/features/widgets/layout/PlaceholderPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<LoginPage />} />
        <Route path='/auth/callback' element={<MicrosoftCallbackPage />} />
        <Route element={<RequireAuth />}>
          <Route path='/dashboard' element={<AppShell />}>
            <Route index element={<ManagerDashboardPage />} />
            <Route path='time' element={<TimePage />} />
            <Route path='users' element={<UsersPage />} />
            <Route
              path='teams'
              element={<PlaceholderPage title='Équipes' />}
            />
            <Route
              path='reports'
              element={<PlaceholderPage title='Rapports & KPIs' />}
            />
            <Route
              path='profile'
              element={<PlaceholderPage title='Mon compte' />}
            />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
