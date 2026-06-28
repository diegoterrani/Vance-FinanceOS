import App from './App';
import Backoffice from './pages/Backoffice';
import Landing from './pages/Landing';
import { detectShell } from './lib/hostShell';

// Top-level shell selector (by hostname). Path-based routing (/signup, /convite,
// /checkout) arrives in F2 with react-router.
export default function Root() {
  const shell = detectShell();
  if (shell === 'backoffice') return <Backoffice />;
  if (shell === 'landing') return <Landing />;
  return <App />;
}
