import { BrowserRouter, Route, Routes } from 'react-router-dom';
import LoginPage from './features/auth/pages/LoginPage';
import { ManagerDashboardPage } from './features/dashboard/pages/ManagerDashboardPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<LoginPage />} />
        <Route path='/dashboard' element={<ManagerDashboardPage />} />
      </Routes>
    </BrowserRouter>
  );
}
