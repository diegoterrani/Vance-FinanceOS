import React, { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Overview from './pages/Overview';
import Reconciliation from './pages/Reconciliation';
import Cashflow from './pages/Cashflow';
import Alerts from './pages/Alerts';
import Settings from './pages/Settings';
import Registers from './pages/Registers';
import Login from './pages/Login';
import Logo from './components/Logo';
import { Transaction, Alert, User, PluggyAccount, WebhookLog, AuditLog, AppState, Company } from './types';
import { supabase } from './lib/supabase';
import * as db from './lib/db';

// Cash-flow chart aggregate (derived/demo; not persisted per-row).
const mockCashflowData = [
  { month: 'Jan', inflow: 34000, outflow: 21000, balance: 13000 },
  { month: 'Fev', inflow: 42000, outflow: 28000, balance: 14000 },
  { month: 'Mar', inflow: 38000, outflow: 32000, balance: 6000 },
  { month: 'Abr', inflow: 51000, outflow: 25000, balance: 26000 },
  { month: 'Mai', inflow: 48000, outflow: 29000, balance: 19000 },
  { month: 'Jun', inflow: 52000, outflow: 31000, balance: 21000 }
];

export default function App() {
  // ---- auth ----
  const [session, setSession] = useState<Session | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [currentView, setCurrentView] = useState('overview');
  const [activeSettingsTab, setActiveSettingsTab] = useState('company');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ---- application state ----
  const [appState, setAppState] = useState<AppState>({
    theme: 'dark',
    sidebarOpen: true,
    density: 'standard',
    selectedCompany: {
      cnpj: '',
      razaoSocial: '',
      nomeFantasia: 'VANCE',
      regime: '',
      minBalanceAlert: 0,
      timezone: 'America/Sao_Paulo',
      certificateUploaded: false
    }
  });

  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyCnpj, setSelectedCompanyCnpj] = useState<string>('consolidado');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [pluggyAccounts, setPluggyAccounts] = useState<PluggyAccount[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Subscribe to the Supabase session.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) setAuthLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (!s) {
        setCurrentUser(null);
        setAuthLoading(false);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // When a session exists, load the profile and all data (scoped by RLS).
  useEffect(() => {
    const uid = session?.user?.id;
    if (!uid) return;
    let active = true;
    (async () => {
      const profile = await db.fetchProfile(uid);
      if (!active) return;
      setCurrentUser(
        profile || {
          id: uid,
          name: (session!.user.user_metadata?.name as string) || session!.user.email || 'Usuário',
          email: session!.user.email || '',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100',
          role: 'analista',
          status: 'active',
          lastActive: 'Agora mesmo',
          lastIp: '',
          device: 'Navegador Web'
        }
      );
      try {
        const data = await db.fetchAll();
        if (!active) return;
        setCompanies(data.companies);
        setTransactions(data.transactions);
        setAlerts(data.alerts);
        setUsers(data.users);
        setPluggyAccounts(data.accounts);
        setAuditLogs(data.auditLogs);
        setWebhookLogs(data.webhookLogs);
        if (data.companies[0]) {
          setAppState(prev => ({ ...prev, selectedCompany: data.companies[0] }));
        }
      } catch (e) {
        console.error('Falha ao carregar dados', e);
      } finally {
        if (active) setAuthLoading(false);
      }
    })();
    return () => { active = false; };
  }, [session?.user?.id]);

  // Theme attribute sync.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', appState.theme);
  }, [appState.theme]);

  const handleNavigate = (view: string) => {
    setCurrentView(view);
    if (view === 'settings') setActiveSettingsTab('company');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setSession(null);
  };

  // Filtered lists based on individual CNPJ vs. Consolidado
  const filteredTransactions = selectedCompanyCnpj === 'consolidado'
    ? transactions
    : transactions.filter(t => t.companyCnpj === selectedCompanyCnpj);

  const filteredAccounts = selectedCompanyCnpj === 'consolidado'
    ? pluggyAccounts
    : pluggyAccounts.filter(a => a.companyCnpj === selectedCompanyCnpj);

  const filteredAlerts = selectedCompanyCnpj === 'consolidado'
    ? alerts
    : alerts.filter(al => al.companyCnpj === selectedCompanyCnpj);

  const handleToggleTheme = () => {
    handleUpdateState({ theme: appState.theme === 'dark' ? 'light' : 'dark' });
  };

  const handleUpdateState = (newState: Partial<AppState>) => {
    setAppState(prev => ({ ...prev, ...newState }));
  };

  const writeAudit = async (action: string, details: string) => {
    if (!currentUser) return;
    await db.insertAudit({ userId: currentUser.id, userName: currentUser.name, action, details });
    setAuditLogs(prev => [
      { id: `aud-${Date.now()}`, userId: currentUser.id, userName: currentUser.name, action, details, timestamp: new Date().toISOString(), ip: currentUser.lastIp },
      ...prev
    ]);
  };

  // ---- dispatchers (persisted via Supabase) ----
  const handleAddTransaction = async (tx: Transaction) => {
    const companyCnpj =
      tx.companyCnpj ||
      (selectedCompanyCnpj === 'consolidado' ? companies[0]?.cnpj : selectedCompanyCnpj) ||
      companies[0]?.cnpj;
    if (!companyCnpj) {
      console.error('Nenhuma empresa disponível para o lançamento.');
      return;
    }
    try {
      const saved = await db.insertTransaction({ ...tx, companyCnpj });
      setTransactions(prev => [saved, ...prev]);
      await writeAudit('NOVA_TRANSAÇÃO_PARSADA', `Lançamento inserido no livro caixa: ${tx.description}`);
    } catch (e) {
      console.error('Falha ao salvar lançamento', e);
    }
  };

  const handleUpdateTransactionStatus = async (id: string, newStatus: any) => {
    const tx = transactions.find(t => t.id === id);
    try {
      await db.updateTransactionStatus(id, newStatus);
      setTransactions(prev => prev.map(t => (t.id === id ? { ...t, status: newStatus } : t)));
      await writeAudit('ATUALIZAR_STATUS', `Lancamento "${tx?.description}" remarcado para o status ${newStatus}`);
    } catch (e) {
      console.error('Falha ao atualizar status', e);
    }
  };

  const handleResolveAlert = async (id: string) => {
    try {
      await db.resolveAlert(id);
      setAlerts(prev => prev.map(a => (a.id === id ? { ...a, status: 'resolved' as any } : a)));
    } catch (e) {
      console.error('Falha ao resolver alerta', e);
    }
  };

  const handleSnoozeAlert = async (id: string, durationHours: number) => {
    const d = new Date();
    d.setHours(d.getHours() + durationHours);
    try {
      await db.snoozeAlert(id, d.toISOString());
      const formattedTime = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      setAlerts(prev => prev.map(a => (a.id === id ? { ...a, status: 'snoozed', snoozedUntil: `${formattedTime} (Hoje)` } as any : a)));
    } catch (e) {
      console.error('Falha ao adiar alerta', e);
    }
  };

  // Adding a teammate requires Supabase Auth admin (invite) — not available
  // client-side. Kept local-only so the Settings UI stays functional.
  const handleAddUser = (user: User) => {
    console.warn('Convite de usuário não persistido: use o cadastro (signup) ou o painel admin do Supabase.');
    setUsers(prev => [...prev, user]);
  };

  const handleUpdateUserRole = async (id: string, role: any) => {
    try {
      await db.updateUserRole(id, role);
      setUsers(prev => prev.map(u => (u.id === id ? { ...u, role } : u)));
    } catch (e) {
      console.error('Falha ao atualizar cargo', e);
    }
  };

  const handleToggleUserStatus = async (id: string) => {
    const u = users.find(x => x.id === id);
    const nextStatus = u?.status === 'active' ? 'inactive' : 'active';
    try {
      await db.updateUserStatus(id, nextStatus);
      setUsers(prev => prev.map(x => (x.id === id ? { ...x, status: nextStatus } : x)));
    } catch (e) {
      console.error('Falha ao alterar status do usuário', e);
    }
  };

  const handleSessionRoleChange = async (newRole: any) => {
    if (!currentUser) return;
    try {
      await db.updateUserRole(currentUser.id, newRole);
      const updated = { ...currentUser, role: newRole };
      setCurrentUser(updated);
      setUsers(prev => prev.map(u => (u.id === currentUser.id ? { ...u, role: newRole } : u)));
    } catch (e) {
      console.error('Falha ao trocar cargo da sessão', e);
    }
  };

  const handleAddPluggyAccount = async (acc: PluggyAccount) => {
    const companyCnpj = acc.companyCnpj || (selectedCompanyCnpj !== 'consolidado' ? selectedCompanyCnpj : companies[0]?.cnpj);
    try {
      const saved = await db.insertAccount({ ...acc, companyCnpj });
      setPluggyAccounts(prev => [...prev, saved]);
    } catch (e) {
      console.error('Falha ao adicionar conta', e);
    }
  };

  const handleRemovePluggyAccount = async (id: string) => {
    try {
      await db.deleteAccount(id);
      setPluggyAccounts(prev => prev.filter(acc => acc.id !== id));
    } catch (e) {
      console.error('Falha ao remover conta', e);
    }
  };

  const handleAddCompany = async (company: Company) => {
    try {
      const saved = await db.insertCompany(company);
      setCompanies(prev => [...prev, saved]);
    } catch (e) {
      console.error('Falha ao adicionar empresa (requer perfil admin)', e);
    }
  };

  const handleRemoveCompany = async (cnpj: string) => {
    try {
      await db.deleteCompany(cnpj);
      setCompanies(prev => prev.filter(c => c.cnpj !== cnpj));
      if (selectedCompanyCnpj === cnpj) setSelectedCompanyCnpj('consolidado');
    } catch (e) {
      console.error('Falha ao remover empresa (requer perfil admin)', e);
    }
  };

  const activeAlertCount = alerts.filter(a => a.status === 'active').length;

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#0A0F1A] text-white">
        <Logo showText={true} size="md" />
        <p className="text-xs text-[#A3A3A3] animate-pulse">Carregando central financeira...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Login />;
  }

  return (
    <div className={`theme-transition min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] ${
      appState.density === 'compact' ? 'compact-density' : appState.density === 'comfortable' ? 'comfortable-density' : ''
    }`}>

      {/* 1. LATERAL BAR SHELL */}
      <Sidebar
        currentView={currentView}
        onNavigate={handleNavigate}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        alertCount={activeAlertCount}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Backdrop overlay for mobile menu */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-xs transition-opacity duration-300"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* 2. CORE LAYOUT DOCK */}
      <div className={`transition-all duration-300 min-h-screen flex flex-col pl-0 ${
        sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-[250px]'
      }`}>

        {/* Global sticky header widget */}
        <Header
          currentView={currentView}
          theme={appState.theme}
          onToggleTheme={handleToggleTheme}
          activeAlerts={filteredAlerts}
          onResolveAlert={handleResolveAlert}
          onNavigate={handleNavigate}
          companyName={selectedCompanyCnpj === 'consolidado' ? 'Grupo Vance (Consolidado)' : companies.find(c => c.cnpj === selectedCompanyCnpj)?.nomeFantasia || 'VANCE'}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenSettingsModal={() => {
            setCurrentView('settings');
            setActiveSettingsTab('bank-api');
          }}
          companies={companies}
          selectedCompanyCnpj={selectedCompanyCnpj}
          onSelectCompanyCnpj={setSelectedCompanyCnpj}
          onChangeRole={handleSessionRoleChange}
        />

        {/* 3. DOCK PAGE VIEW */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto animate-fade-in pb-12">
          {currentView === 'overview' && (
            <Overview
              transactions={filteredTransactions}
              alerts={filteredAlerts}
              onNavigate={setCurrentView}
              onResolveAlert={handleResolveAlert}
              mockCashflowData={mockCashflowData}
            />
          )}

          {currentView === 'registers' && (
            <Registers
              transactions={filteredTransactions}
              onAddTransaction={handleAddTransaction}
              currentUser={currentUser}
            />
          )}

          {currentView === 'reconciliation' && (
            <Reconciliation
              transactions={filteredTransactions}
              onUpdateStatus={handleUpdateTransactionStatus}
              onAddTransaction={handleAddTransaction}
              currentUser={currentUser}
            />
          )}

          {currentView === 'cashflow' && (
            <Cashflow mockCashflowData={mockCashflowData} />
          )}

          {currentView === 'alerts' && (
            <Alerts
              alerts={filteredAlerts}
              onResolveAlert={handleResolveAlert}
              onSnoozeAlert={handleSnoozeAlert}
            />
          )}

          {currentView === 'settings' && (
            <Settings
              appState={appState}
              onUpdateState={handleUpdateState}
              users={users}
              onAddUser={handleAddUser}
              onUpdateUserRole={handleUpdateUserRole}
              onToggleUserStatus={handleToggleUserStatus}
              pluggyAccounts={filteredAccounts}
              onAddPluggyAccount={handleAddPluggyAccount}
              webhookLogs={webhookLogs}
              auditLogs={auditLogs}
              onOpenSettingsModal={() => {
                setCurrentView('settings');
                setActiveSettingsTab('bank-api');
              }}
              companies={companies}
              onAddCompany={handleAddCompany}
              onRemoveCompany={handleRemoveCompany}
              onRemovePluggyAccount={handleRemovePluggyAccount}
              activeSettingsTab={activeSettingsTab}
              currentUser={currentUser}
            />
          )}
        </main>

      </div>
    </div>
  );
}
