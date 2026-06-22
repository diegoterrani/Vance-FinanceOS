'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppState } from '@/lib/types';

// ----------------------------------------------------------------------------
// UI Store — estado global de preferências de interface
// Persiste no localStorage (tema, density, sidebar) entre sessões.
// AppState.selectedCompany virá do Supabase na Fase 2.
// ----------------------------------------------------------------------------

interface UIStore {
  appState: AppState;
  sidebarCollapsed: boolean;
  mobileMenuOpen: boolean;
  currentView: string;
  updateAppState: (partial: Partial<AppState>) => void;
  toggleTheme: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  setMobileMenuOpen: (v: boolean) => void;
  setCurrentView: (view: string) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      appState: {
        theme: 'dark',
        sidebarOpen: true,
        density: 'standard',
        selectedCompany: {
          cnpj: '12345678000199',
          razaoSocial: 'Vance Soluções de Crescimento LTDA',
          nomeFantasia: 'VANCE',
          regime: 'Simples Nacional',
          minBalanceAlert: 10000.0,
          timezone: 'America/Sao_Paulo',
          certificateUploaded: true,
          certificateExpiry: '21/06/2027',
        },
      },
      sidebarCollapsed: false,
      mobileMenuOpen: false,
      currentView: 'overview',

      updateAppState: (partial) =>
        set((state) => ({ appState: { ...state.appState, ...partial } })),

      toggleTheme: () =>
        set((state) => ({
          appState: {
            ...state.appState,
            theme: state.appState.theme === 'dark' ? 'light' : 'dark',
          },
        })),

      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      setMobileMenuOpen: (v) => set({ mobileMenuOpen: v }),
      setCurrentView: (view) => set({ currentView: view }),
    }),
    {
      name: 'vance-ui-store',
      // Persiste apenas preferências de UI — nunca dados sensíveis
      partialize: (state) => ({
        appState: {
          theme: state.appState.theme,
          density: state.appState.density,
          sidebarOpen: state.appState.sidebarOpen,
        },
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);
