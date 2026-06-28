export type Shell = 'app' | 'backoffice' | 'landing';

// Picks which top-level shell to render based on the hostname.
//   admin.vance.expert      -> backoffice (super-admin)
//   vance.expert / www.     -> landing (sales)
//   finance.vance.expert    -> app (client product)
//   *.vercel.app / localhost -> app (dev/preview default)
// Override for local testing with ?shell=landing|backoffice|app
export function detectShell(): Shell {
  if (typeof window === 'undefined') return 'app';
  const params = new URLSearchParams(window.location.search);
  const forced = params.get('shell');
  if (forced === 'landing' || forced === 'backoffice' || forced === 'app') return forced;

  const host = window.location.host.toLowerCase();
  if (host.startsWith('admin.')) return 'backoffice';
  if (host.startsWith('www.') || host === 'vance.expert') return 'landing';
  return 'app';
}

export const APP_URL = 'https://finance.vance.expert';
