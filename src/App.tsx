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
import ResetPassword from './pages/ResetPassword';
import Logo from './components/Logo';
import { Transaction, Alert, User, PluggyAccount, WebhookLog, AuditLog, AppState, Company } from './types';
import { supabase } from './lib/supabase';
import * as db from './lib/db';

const MONTHS_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

// Monthly inflow/outflow/balance derived from real transactions (last 6 months).
function deriveCashflow(txs: Transaction[]) {
  const byMonth = new Map<string, { month: string; inflow: number; outflow: number; balance: number }>();
  for (const t of txs) {
    if (!t.date) continue;
    const d = new Date(t.date + 'T00:00:00');
    if (isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
    const cur = byMonth.get(key) || { month: MONTHS_PT[d.getMonth()], inflow: 0, outflow: 0, balance: 0 };
    const v = Number(t.value) || 0;
    if (t.direction === 'inflow' || v > 0) cur.inflow += Math.abs(v);
    else cur.outflow += Math.abs(v);
    cur.balance = cur.inflow - cur.outflow;
    byMonth.set(key, cur);
  }
  return Array.from(byMonth.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .slice(-6)
    .map(([, v]) => v);
}

export default function App() {
  // ---- auth ----
  const [session, setSession] = useState<Session | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [recoveryMode, setRecoveryMode] = useState(
    () => typeof window !== 'undefined' && window.location.hash.includes('type=recovery'),
  );

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
  const [integrationSettings, setIntegrationSettings] = useState<db.IntegrationSetting[]>([]);
  const [invites, setInvites] = useState<db.TeamInvite[]>([]);
  const [tenant, setTenant] = useState<db.Tenant | null>(null);
  const [registries, setRegistries] = useState<db.Registry[]>([]);

  // Subscribe to the Supabase session.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) setAuthLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'PASSWORD_RECOVERY') setRecoveryMode(true);
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
      const t = await db.fetchCurrentTenant(uid);
      if (active) setTenant(t);

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
        setIntegrationSettings(data.integrationSettings);
        setInvites(data.invites);
        setRegistries(data.registries);
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

  const startCheckout = async (planCode?: string) => {
    const { data: { session: s } } = await supabase.auth.getSession();
    const token = s?.access_token;
    if (!token) return;
    try {
      const resp = await fetch('/api/mp/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(planCode ? { plan: planCode } : {}),
      });
      const j = await resp.json();
      if (j.init_point) window.location.href = j.init_point;
      else alert(j.error || 'Falha ao iniciar a assinatura.');
    } catch (e: any) {
      alert(e?.message || 'Falha ao iniciar a assinatura.');
    }
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
  // Invitations are persisted via onInvite (team_invites); no local fake row.
  const handleAddUser = (_user: User) => {};

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

  const handleSaveIntegration = async (
    kind: db.IntegrationSetting['kind'],
    ref: string,
    config: any,
    status?: string,
  ) => {
    const cnpj = appState.selectedCompany?.cnpj || companies[0]?.cnpj;
    if (!cnpj) return;
    try {
      const saved = await db.upsertIntegration(cnpj, kind, ref, config, status);
      setIntegrationSettings(prev => [
        ...prev.filter(s => !(s.companyCnpj === saved.companyCnpj && s.kind === saved.kind && s.ref === saved.ref)),
        saved,
      ]);
    } catch (e) {
      console.error('Falha ao salvar integração (requer perfil admin)', e);
    }
  };

  const handleUpdateCompany = async (company: Company) => {
    try {
      const saved = await db.updateCompany(company);
      setCompanies(prev => prev.map(c => (c.cnpj === saved.cnpj ? saved : c)));
      setAppState(prev => (prev.selectedCompany?.cnpj === saved.cnpj ? { ...prev, selectedCompany: saved } : prev));
    } catch (e) {
      console.error('Falha ao atualizar empresa (requer perfil admin)', e);
    }
  };

  const handleInvite = async (invite: { email: string; name?: string; role: string }) => {
    const cnpj = appState.selectedCompany?.cnpj || companies[0]?.cnpj;
    if (!cnpj) return;
    try {
      const saved = await db.createInvite({ ...invite, companyCnpj: cnpj });
      setInvites(prev => [saved, ...prev.filter(i => i.id !== saved.id)]);
      await writeAudit('CONVIDAR_USUARIO', `Convite enviado para ${invite.email} (${invite.role})`);
    } catch (e) {
      console.error('Falha ao convidar usuário (requer perfil admin)', e);
    }
  };

  const handleAddRegistry = async (item: db.Registry) => {
    const cnpj =
      item.companyCnpj ||
      (selectedCompanyCnpj === 'consolidado' ? companies[0]?.cnpj : selectedCompanyCnpj) ||
      companies[0]?.cnpj;
    if (!cnpj) {
      console.error('Nenhuma empresa disponível para o lançamento previsto.');
      return;
    }
    try {
      const saved = await db.insertRegistry(item, cnpj);
      setRegistries(prev => [saved, ...prev]);
    } catch (e) {
      console.error('Falha ao salvar lançamento previsto', e);
    }
  };

  const handleDeleteRegistry = async (id: string) => {
    try {
      await db.deleteRegistry(id);
      setRegistries(prev => prev.filter(r => r.id !== id));
    } catch (e) {
      console.error('Falha ao remover lançamento previsto', e);
    }
  };

  const handleRealizeRegistry = async (item: db.Registry) => {
    // Create the realized transaction and mark the registry as realized.
    const tx: Transaction = {
      id: `tx-reg-${Date.now()}`,
      description: item.description,
      bank: item.bank,
      bankCode: ({
        'Itaú Unibanco S.A.': '341',
        'Banco do Brasil S.A.': '001',
        'XP Investimentos': '102',
        'Banco C6 S.A.': '336',
        'Caixa Econômica Federal': '104',
        'Banco Genial S.A.': '125',
      } as Record<string, string>)[item.bank] || '102',
      direction: item.direction,
      status: 'pending',
      value: item.value,
      date: item.dueDate,
      reference: item.documentNumber || 'CADASTRO PREVISTO',
      category: item.category,
      score: 0.99,
      companyCnpj: item.companyCnpj,
    };
    await handleAddTransaction(tx);
    try {
      await db.updateRegistryStatus(item.id, 'realized');
      setRegistries(prev => prev.map(r => (r.id === item.id ? { ...r, status: 'realized' } : r)));
    } catch (e) {
      console.error('Falha ao efetivar lançamento', e);
    }
  };

  const cashflowData = deriveCashflow(transactions);
  const activeAlertCount = alerts.filter(a => a.status === 'active').length;
  const trialDaysLeft = tenant?.status === 'trialing' && tenant.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(tenant.trialEndsAt).getTime() - Date.now()) / 86400000))
    : null;

  if (recoveryMode) {
    return <ResetPassword onDone={() => setRecoveryMode(false)} />;
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[var(--bg-app)] text-white">
        <Logo showText={true} size="md" />
        <p className="text-xs text-[var(--text-secondary)] animate-pulse">Carregando central financeira...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Login />;
  }

  if (tenant?.status === 'suspended') {
    return (
      <div className="min-h-screen grid place-items-center bg-[var(--bg-app)] text-white px-4">
        <div className="text-center max-w-md">
          <Logo showText size="md" className="justify-center" />
          <h1 className="mt-6 text-xl font-bold">Assinatura suspensa</h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            O acesso a esta conta está suspenso por pendência de pagamento. Regularize a assinatura para reativar o Vance Expert.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <button onClick={() => startCheckout()} className="text-xs font-semibold px-4 py-2 rounded-lg bg-[var(--text-primary)] text-[var(--bg-app)] hover:bg-white">
              Assinar / Regularizar
            </button>
            <button onClick={handleLogout} className="text-xs font-semibold px-4 py-2 rounded-lg border border-[var(--border-mid)] hover:bg-white/10">
              Sair
            </button>
          </div>
        </div>
      </div>
    );
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
          {trialDaysLeft !== null && (
            <div className="mb-4 px-4 py-2.5 rounded-lg border border-blue-500/20 bg-blue-500/5 text-xs text-blue-300 flex items-center justify-between gap-3">
              <span>Período de avaliação: <strong>{trialDaysLeft} dia(s)</strong> restante(s) do trial do plano {tenant?.plan?.name || ''}.</span>
              <button onClick={() => startCheckout()} className="shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded-md bg-blue-500/20 hover:bg-blue-500/30 text-blue-100">
                Assinar agora
              </button>
            </div>
          )}
          {tenant?.status === 'past_due' && (
            <div className="mb-4 px-4 py-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 text-xs text-amber-300 flex items-center justify-between gap-3">
              <span>Pagamento pendente. Regularize a assinatura para evitar a suspensão do acesso.</span>
              <button onClick={() => startCheckout()} className="shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-100">
                Regularizar
              </button>
            </div>
          )}
          {currentView === 'overview' && (
            <Overview
              transactions={filteredTransactions}
              alerts={filteredAlerts}
              accounts={filteredAccounts}
              onNavigate={setCurrentView}
              onResolveAlert={handleResolveAlert}
              mockCashflowData={cashflowData}
            />
          )}

          {currentView === 'registers' && (
            <Registers
              transactions={filteredTransactions}
              onAddTransaction={handleAddTransaction}
              currentUser={currentUser}
              registries={selectedCompanyCnpj === 'consolidado' ? registries : registries.filter(r => r.companyCnpj === selectedCompanyCnpj)}
              onAddRegistry={handleAddRegistry}
              onDeleteRegistry={handleDeleteRegistry}
              onRealizeRegistry={handleRealizeRegistry}
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
            <Cashflow mockCashflowData={cashflowData} transactions={filteredTransactions} accounts={filteredAccounts} />
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
              onUpdateCompany={handleUpdateCompany}
              onRemoveCompany={handleRemoveCompany}
              onRemovePluggyAccount={handleRemovePluggyAccount}
              activeSettingsTab={activeSettingsTab}
              currentUser={currentUser}
              integrationSettings={integrationSettings}
              onSaveIntegration={handleSaveIntegration}
              invites={invites}
              onInvite={handleInvite}
            />
          )}
        </main>

      </div>

      <a
        href="/suporte"
        title="Abrir suporte"
        aria-label="Abrir suporte"
        className="fixed bottom-5 right-5 z-40 flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-soft)] text-[var(--text-primary)] text-xs font-semibold shadow-lg hover:bg-[var(--bg-card-hover)] transition-all"
      >
        Suporte
      </a>
    </div>
  );
}
