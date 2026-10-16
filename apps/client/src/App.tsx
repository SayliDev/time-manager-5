import { BrowserRouter, Route, Routes } from 'react-router-dom';
import LoginPage from '@/features/auth/pages/LoginPage';
import { ManagerDashboardPage } from '@/features/dashboard/pages/ManagerDashboardPage';
import { TimePage } from '@/features/time/pages/TimePage';
import { TeamsPage } from '@/features/teams/pages/TeamsPage';
import { UsersPage } from '@/features/users/pages/UsersPage';
import { AppShell } from '@/features/widgets/layout/AppShell';
import { PlaceholderPage } from '@/features/widgets/layout/PlaceholderPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<LoginPage />} />
        <Route path='/dashboard' element={<AppShell />}>
          <Route index element={<ManagerDashboardPage />} />
          <Route path='time' element={<TimePage />} />
          <Route path='users' element={<UsersPage />} />
          <Route path='teams' element={<TeamsPage />} />
          <Route
            path='reports'
            element={<PlaceholderPage title='Rapports & KPIs' />}
          />
          <Route
            path='profile'
            element={<PlaceholderPage title='Mon compte' />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
