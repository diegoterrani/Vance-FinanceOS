import { Component } from 'react';

// Catches render errors so the app shows a recovery screen instead of a blank page.
// Loosely typed (project has no @types/react); inline styles so it renders even
// if CSS failed to load.
export default class ErrorBoundary extends (Component as any) {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error) { console.error('App error:', error); }
  render() {
    const error = (this as any).state.error as Error | null;
    if (error) {
      return (
        <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg-app, #0A0A0A)', color: 'var(--text-primary, #F5F5F5)', fontFamily: 'Inter, system-ui, sans-serif', padding: '1rem', textAlign: 'center' }}>
          <div>
            <h1 style={{ fontWeight: 800, fontSize: '1.1rem' }}>Algo deu errado</h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #A3A3A3)', marginTop: '0.5rem' }}>
              Recarregue a página. Se o problema persistir, abra um chamado no suporte.
            </p>
            <button onClick={() => location.reload()} style={{ marginTop: '1rem', fontSize: '0.8rem', fontWeight: 600, padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid var(--border-mid, #333)', background: 'transparent', color: 'inherit', cursor: 'pointer' }}>
              Recarregar
            </button>
          </div>
        </div>
      );
    }
    return (this as any).props.children;
  }
}
