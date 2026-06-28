import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import Backoffice from './pages/Backoffice';
import Landing from './pages/Landing';
import Signup from './pages/Signup';
import Support from './pages/Support';
import { detectShell } from './lib/hostShell';

// Top-level shell selector (by hostname). Within the client app shell we use
// react-router for /signup (and future /convite, /checkout).
export default function Root() {
  const shell = detectShell();
  if (shell === 'backoffice') return <Backoffice />;
  if (shell === 'landing') return <Landing />;
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/suporte" element={<Support />} />
        <Route path="*" element={<App />} />
      </Routes>
    </BrowserRouter>
  );
}
