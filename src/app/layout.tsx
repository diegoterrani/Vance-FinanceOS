import type { Metadata } from 'next';
import './globals.css';
import ThemeProvider from '@/components/layout/ThemeProvider';

export const metadata: Metadata = {
  title: 'FinanceOS — Gestão Financeira Inteligente',
  description: 'Plataforma SaaS de gestão financeira para empresas brasileiras',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" data-theme="dark" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
