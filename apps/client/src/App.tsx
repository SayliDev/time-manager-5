import Page from './features/auth/components/Page';
import { Routes, Route, BrowserRouter } from 'react-router-dom';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Page />} />
      </Routes>
    </BrowserRouter>
  );
}
