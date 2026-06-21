import React, { useState, useEffect } from 'react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Overview from './pages/Overview';
import Reconciliation from './pages/Reconciliation';
import Cashflow from './pages/Cashflow';
import Alerts from './pages/Alerts';
import Settings from './pages/Settings';
import Registers from './pages/Registers';
import { Transaction, Alert, User, PluggyAccount, WebhookLog, AuditLog, AppState } from './types';
import { DEFAULT_APP_SNAPSHOT, persistAppSnapshot, loadAppSnapshot } from './lib/appSnapshot';

const mockCashflowData = [
  { month: 'Jan', inflow: 34000, outflow: 21000, balance: 13000 },
  { month: 'Fev', inflow: 42000, outflow: 28000, balance: 14000 },
  { month: 'Mar', inflow: 38000, outflow: 32000, balance: 6000 },
  { month: 'Abr', inflow: 51000, outflow: 25000, balance: 26000 },
  { month: 'Mai', inflow: 48000, outflow: 29000, balance: 19000 },
  { month: 'Jun', inflow: 52000, outflow: 31000, balance: 21000 }
];

export default function App() {
  const [currentView, setCurrentView] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [snapshotReady, setSnapshotReady] = useState(false);

  // Core application state
  const [appState, setAppState] = useState<AppState>(DEFAULT_APP_SNAPSHOT.appState);

  // Database lists state
  const [transactions, setTransactions] = useState<Transaction[]>(DEFAULT_APP_SNAPSHOT.transactions);
  const [alerts, setAlerts] = useState<Alert[]>(DEFAULT_APP_SNAPSHOT.alerts);
  const [users, setUsers] = useState<User[]>(DEFAULT_APP_SNAPSHOT.users);
  const [pluggyAccounts, setPluggyAccounts] = useState<PluggyAccount[]>(DEFAULT_APP_SNAPSHOT.pluggyAccounts);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>(DEFAULT_APP_SNAPSHOT.webhookLogs);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(DEFAULT_APP_SNAPSHOT.auditLogs);

  useEffect(() => {
    let active = true;

    const bootstrapSnapshot = async () => {
      const snapshot = await loadAppSnapshot();

      if (!active) {
        return;
      }

      setAppState(snapshot.appState);
      setTransactions(snapshot.transactions);
      setAlerts(snapshot.alerts);
      setUsers(snapshot.users);
      setPluggyAccounts(snapshot.pluggyAccounts);
      setWebhookLogs(snapshot.webhookLogs);
      setAuditLogs(snapshot.auditLogs);
      setSnapshotReady(true);
    };

    bootstrapSnapshot();

    return () => {
      active = false;
    };
  }, []);

  // Sync state setting properties on document Root for dark/light mode switches
  const handleToggleTheme = () => {
    const nextTheme = appState.theme === 'dark' ? 'light' : 'dark';
    handleUpdateState({ theme: nextTheme });
  };

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', appState.theme);
  }, [appState.theme]);

  useEffect(() => {
    if (!snapshotReady) {
      return;
    }

    persistAppSnapshot({
      appState,
      transactions,
      alerts,
      users,
      pluggyAccounts,
      webhookLogs,
      auditLogs,
    });
  }, [snapshotReady, appState, transactions, alerts, users, pluggyAccounts, webhookLogs, auditLogs]);

  // Partial settings updator
  const handleUpdateState = (newState: Partial<AppState>) => {
    setAppState(prev => ({ ...prev, ...newState }));
  };

  // Dispatchers
  const handleAddTransaction = (tx: Transaction) => {
    setTransactions(prev => [tx, ...prev]);
    // create audit
    const newAudit: AuditLog = {
      id: `aud-${Date.now()}`,
      userId: 'u-1',
      userName: 'Diego Terrani',
      action: 'NOVA_TRANSAÇÃO_PARSADA',
      details: `Lançamento manual inserido no livro caixa: ${tx.description}`,
      timestamp: new Date().toISOString(),
      ip: '177.34.21.198'
    };
    setAuditLogs(prev => [newAudit, ...prev]);
  };

  const handleUpdateTransactionStatus = (id: string, newStatus: any) => {
    setTransactions(prev => prev.map(t => {
      if (t.id === id) {
        return { ...t, status: newStatus };
      }
      return t;
    }));

    // create audit
    const tx = transactions.find(t => t.id === id);
    const newAudit: AuditLog = {
      id: `aud-${Date.now()}`,
      userId: 'u-1',
      userName: 'Diego Terrani',
      action: 'ATUALIZAR_STATUS',
      details: `Lancamento "${tx?.description}" remarcado para o status ${newStatus}`,
      timestamp: new Date().toISOString(),
      ip: '177.34.21.198'
    };
    setAuditLogs(prev => [newAudit, ...prev]);
  };

  const handleResolveAlert = (id: string) => {
    setAlerts(prev => prev.map(alert => {
      if (alert.id === id) {
        return { ...alert, status: 'resolved' as any };
      }
      return alert;
    }));
  };

  const handleSnoozeAlert = (id: string, durationHours: number) => {
    const d = new Date();
    d.setHours(d.getHours() + durationHours);
    const formattedTime = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    setAlerts(prev => prev.map(alert => {
      if (alert.id === id) {
        return { ...alert, status: 'snoozed', snoozedUntil: `${formattedTime} (Hoje)` } as any;
      }
      return alert;
    }));
  };

  const handleAddUser = (user: User) => {
    setUsers(prev => [...prev, user]);
  };

  const handleUpdateUserRole = (id: string, role: any) => {
    setUsers(prev => prev.map(u => {
      if (u.id === id) {
        return { ...u, role };
      }
      return u;
    }));
  };

  const handleToggleUserStatus = (id: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === id) {
        const nextStatus = u.status === 'active' ? 'inactive' : 'active';
        return { ...u, status: nextStatus };
      }
      return u;
    }));
  };

  const handleAddPluggyAccount = (acc: PluggyAccount) => {
    setPluggyAccounts(prev => [...prev, acc]);
  };

  const activeAlertCount = alerts.filter(a => a.status === 'active').length;

  if (!snapshotReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-app)] text-[var(--text-primary)]">
        <div className="glass-card px-6 py-4 text-sm text-[var(--text-secondary)]">
          Carregando ambiente financeiro...
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
        onNavigate={setCurrentView}
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
          activeAlerts={alerts}
          onResolveAlert={handleResolveAlert}
          onNavigate={setCurrentView}
          companyName={appState.selectedCompany.nomeFantasia}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        />

        {/* 3. DOCK PAGE VIEW */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto animate-fade-in pb-12">
          {currentView === 'overview' && (
            <Overview
              transactions={transactions}
              alerts={alerts}
              onNavigate={setCurrentView}
              onResolveAlert={handleResolveAlert}
              mockCashflowData={mockCashflowData}
            />
          )}

          {currentView === 'registers' && (
            <Registers
              transactions={transactions}
              onAddTransaction={handleAddTransaction}
            />
          )}

          {currentView === 'reconciliation' && (
            <Reconciliation
              transactions={transactions}
              onUpdateStatus={handleUpdateTransactionStatus}
              onAddTransaction={handleAddTransaction}
            />
          )}

          {currentView === 'cashflow' && (
            <Cashflow mockCashflowData={mockCashflowData} />
          )}

          {currentView === 'alerts' && (
            <Alerts
              alerts={alerts}
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
              pluggyAccounts={pluggyAccounts}
              onAddPluggyAccount={handleAddPluggyAccount}
              webhookLogs={webhookLogs}
              auditLogs={auditLogs}
            />
          )}
        </main>

      </div>
    </div>
  );
}
