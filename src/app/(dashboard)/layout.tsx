'use client';

import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { useUIStore } from '@/store/ui.store';
import { useRouter, usePathname } from 'next/navigation';
import { initialAlerts } from '@/lib/mock-data';
import { useState } from 'react';
import type { Alert } from '@/lib/types';

/**
 * Dashboard Layout — envolve todas as rotas (dashboard).
 * Sidebar + Header compartilhados entre /overview, /reconciliation, etc.
 * Na Fase 2: alerts virão do Supabase Realtime em vez de mock-data.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { appState, sidebarCollapsed, setSidebarCollapsed, mobileMenuOpen, setMobileMenuOpen, toggleTheme } = useUIStore();
  const pathname = usePathname();
  const router = useRouter();

  // TODO Fase 2: substituir por useQuery('alerts') do Supabase
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);

  const currentView = pathname.split('/').pop() ?? 'overview';

  const handleNavigate = (view: string) => router.push(`/${view}`);

  const handleResolveAlert = (id: string) =>
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'resolved' as const } : a)));

  const activeAlertCount = alerts.filter((a) => a.status === 'active').length;

  return (
    <div
      className={`min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] ${
        appState.density === 'compact'
          ? 'compact-density'
          : appState.density === 'comfortable'
          ? 'comfortable-density'
          : ''
      }`}
    >
      <Sidebar
        currentView={currentView}
        onNavigate={handleNavigate}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        alertCount={activeAlertCount}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div
        className={`transition-all duration-300 min-h-screen flex flex-col pl-0 ${
          sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-[250px]'
        }`}
      >
        <Header
          currentView={currentView}
          theme={appState.theme}
          onToggleTheme={toggleTheme}
          activeAlerts={alerts}
          onResolveAlert={handleResolveAlert}
          onNavigate={handleNavigate}
          companyName={appState.selectedCompany.nomeFantasia}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        />

        <main className="flex-1 p-6 max-w-7xl w-full mx-auto animate-fade-in pb-12">
          {children}
        </main>
      </div>
    </div>
  );
}
