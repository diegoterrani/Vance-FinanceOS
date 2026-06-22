'use client';

import { useEffect } from 'react';
import { useUIStore } from '@/store/ui.store';

/**
 * ThemeProvider — Seção 6.1 do documento
 * 1. Lê preferência do Zustand store (persistida no localStorage)
 * 2. Aplica data-theme='dark' | 'light' no <html>
 * 3. Escuta mudanças do OS em tempo real (matchMedia listener)
 *    apenas quando theme = 'system' (extensão futura)
 */
export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useUIStore((s) => s.appState.theme);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
  }, [theme]);

  return <>{children}</>;
}
