import React, { useState, useEffect } from 'react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Overview from './pages/Overview';
import Reconciliation from './pages/Reconciliation';
import Cashflow from './pages/Cashflow';
import Alerts from './pages/Alerts';
import Settings from './pages/Settings';
import Registers from './pages/Registers';
import Login from './pages/Login';
import { Transaction, Alert, User, PluggyAccount, WebhookLog, AuditLog, AppState, Company } from './types';

// App initialization mock database
const initialTransactions: Transaction[] = [
  {
    id: 'tx-1',
    description: 'PIX RECEBIDO CONTRATO MENSAL SUITE',
    bank: 'XP Investimentos',
    bankCode: '102',
    direction: 'inflow',
    status: 'matched',
    value: 18200.00,
    date: '2026-06-21',
    reference: 'PIX EM ENTRADA RECORRENTE',
    category: 'Contratos Clientes',
    score: 0.98,
    companyCnpj: '12345678000199'
  },
  {
    id: 'tx-2',
    description: 'PAGAMENTO FORNECEDOR NUVEM HOSTING',
    bank: 'Itaú Unibanco S.A.',
    bankCode: '341',
    direction: 'outflow',
    status: 'matched',
    value: -4400.00,
    date: '2026-06-20',
    reference: 'AWS HOSTING CLOUD RUN DEBITO',
    category: 'Sistemas e Softwares',
    score: 0.91,
    companyCnpj: '12345678000199'
  },
  {
    id: 'tx-3',
    description: 'TRANSFERENCIA TED ENTRADA ADIANTAMENTO',
    bank: 'Itaú Unibanco S.A.',
    bankCode: '341',
    direction: 'inflow',
    status: 'pending',
    value: 12500.00,
    date: '2026-06-21',
    reference: 'TED STRIPE PAYMENTS INBOUND',
    category: 'Contratos Clientes',
    score: 0.78,
    companyCnpj: '12345678000199'
  },
  {
    id: 'tx-4',
    description: 'IMPOSTO GUIA DAS RECOLHIMENTO MENSAL',
    bank: 'Banco do Brasil S.A.',
    bankCode: '001',
    direction: 'outflow',
    status: 'matched',
    value: -10300.00,
    date: '2026-06-19',
    reference: 'PAGAMENTO GUIA SIMPLES DAS SFN',
    category: 'Impostos e Contribuições',
    score: 0.99,
    companyCnpj: '98765432000100'
  },
  {
    id: 'tx-5',
    description: 'RETIRADA PRO LABORE SOCIO INTERNO',
    bank: 'Itaú Unibanco S.A.',
    bankCode: '341',
    direction: 'outflow',
    status: 'pending',
    value: -8500.00,
    date: '2026-06-18',
    reference: 'REMUNERACAO PROLABORE MENSAL',
    category: 'Folha de Pagamento',
    score: 0.65,
    companyCnpj: '98765432000100'
  },
  {
    id: 'tx-6',
    description: 'RENDIMENTOS APLICAÇÃO CDI DIÁRIA',
    bank: 'XP Investimentos',
    bankCode: '102',
    direction: 'inflow',
    status: 'matched',
    value: 1840.00,
    date: '2026-06-17',
    reference: 'CDI XP INVESTIMENTOS CDB LIQUIDO',
    category: 'Juros e Rendimentos',
    score: 0.95,
    companyCnpj: '98765432000100'
  }
];

const initialAlerts: Alert[] = [
  {
    id: 'al-1',
    title: 'Saldo Itaú abaixo do limite de segurança',
    description: 'O saldo sincronizado via API Bancária Direta (R$ 4.200,00) está inferior à margem parametrizada de R$ 10.000,00.',
    level: 'critical',
    status: 'active',
    category: 'API Bancária',
    date: '2026-06-21',
    companyCnpj: '12345678000199'
  },
  {
    id: 'al-2',
    title: 'Duplicata Fornecedor vencendo hoje',
    description: 'Título financeiro Silveira Express (R$ 3.100,00) registra vencimento em 21/06 sem conciliação correspondente no extrato bancário.',
    level: 'high',
    status: 'active',
    category: 'Faturamento',
    date: '2026-06-21',
    companyCnpj: '98765432000100'
  },
  {
    id: 'al-3',
    title: 'Sincronização de API Bancária PJ ativa',
    description: 'Contas bancárias sincronizadas perfeitamente com os endpoints de produção à 1 hora atrás.',
    level: 'info',
    status: 'active',
    category: 'Sincronização',
    date: '2026-06-21',
    companyCnpj: '12345678000199'
  }
];

const initialUsers: User[] = [
  {
    id: 'u-1',
    name: 'Diego Terrani',
    email: 'diego.terrani@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100',
    role: 'admin',
    status: 'active',
    lastActive: 'Agora mesmo',
    lastIp: '177.34.21.198',
    device: 'macOS Chrome 126'
  },
  {
    id: 'u-2',
    name: 'Mariana Santos',
    email: 'mariana.santos@vance.com.br',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100',
    role: 'tesouraria',
    status: 'active',
    lastActive: 'Ontem 18:40',
    lastIp: '189.44.12.22',
    device: 'Windows Edge 125'
  },
  {
    id: 'u-3',
    name: 'André Silveira',
    email: 'andre.silveira@vance.com.br',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100',
    role: 'analista',
    status: 'active',
    lastActive: '3 dias atrás',
    lastIp: '191.134.12.82',
    device: 'Linux Mint Firefox 112'
  },
  {
    id: 'u-4',
    name: 'Lucas Oliveira',
    email: 'lucas.oliveira@vance.com.br',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100',
    role: 'viewer',
    status: 'active',
    lastActive: '5 minutos atrás',
    lastIp: '177.40.10.150',
    device: 'iOS Chrome 126'
  },
  {
    id: 'u-5',
    name: 'Camila Xavier',
    email: 'camila.xavier@vance.com.br',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100',
    role: 'gerencia',
    status: 'active',
    lastActive: '2 horas atrás',
    lastIp: '179.24.120.30',
    device: 'macOS Safari 17.4'
  },
  {
    id: 'u-6',
    name: 'Roberto Dias',
    email: 'roberto.dias@vance.com.br',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100',
    role: 'diretor',
    status: 'active',
    lastActive: 'Hoje 10:15',
    lastIp: '200.180.45.12',
    device: 'Windows Firefox 125'
  }
];

const initialPluggyAccounts: PluggyAccount[] = [
  {
    id: 'acc-itau',
    name: 'Itaú Unibanco S.A.',
    type: 'checking',
    bankName: 'Itaú Corp',
    balance: 4200.00,
    syncStatus: 'success',
    lastSync: '06:00 Hoje',
    companyCnpj: '12345678000199'
  },
  {
    id: 'acc-xp',
    name: 'XP Investimentos',
    type: 'investment',
    bankName: 'XP Corporate',
    balance: 44120.00,
    syncStatus: 'success',
    lastSync: '06:00 Hoje',
    companyCnpj: '12345678000199'
  },
  {
    id: 'acc-nubank',
    name: 'Nubank PJ',
    type: 'checking',
    bankName: 'Nubank Co-Corp',
    balance: 15300.00,
    syncStatus: 'success',
    lastSync: '06:00 Hoje',
    companyCnpj: '98765432000100'
  },
  {
    id: 'acc-cash-1',
    name: 'Caixa Interno em Espécie',
    type: 'cash',
    bankName: 'Caixa Físico',
    balance: 3800.00,
    syncStatus: 'success',
    lastSync: 'Manual',
    companyCnpj: '12345678000199'
  }
];

const initialWebhookLogs: WebhookLog[] = [
  { id: 'wh-1', url: 'https://meu-sistema-erp.com/webhooks/vance', event: 'cnab.processed', status: 'success', timestamp: '21/06 14:10', duration: 154, statusCode: 200 },
  { id: 'wh-2', url: 'https://meu-sistema-erp.com/webhooks/vance', event: 'balance.alert', status: 'success', timestamp: '21/06 13:00', duration: 89, statusCode: 200 },
  { id: 'wh-3', url: 'https://meu-sistema-erp.com/webhooks/vance', event: 'cnab.processed', status: 'failed', timestamp: '20/06 09:12', duration: 320, statusCode: 502 }
];

const initialAuditLogs: AuditLog[] = [
  { id: 'aud-1', userId: 'u-1', userName: 'Diego Terrani', action: 'CONCILIAÇÃO_AUTO', details: 'Aprovação massiva de 4 lançamentos via CNAB retornado', timestamp: '2026-06-21T14:10:00Z', ip: '177.34.21.198' },
  { id: 'aud-2', userId: 'u-1', userName: 'Diego Terrani', action: 'ATUALIZAR_CERTIFICADO', details: 'Arquivo de faturamento certificado A1 enviado (.pfx)', timestamp: '2026-06-21T12:00:00Z', ip: '177.34.21.198' },
  { id: 'aud-3', userId: 'u-2', userName: 'Mariana Santos', action: 'OPEN_FINANCE_SYNC', details: 'Forçado sincronismo manual nas agências de XP Corp', timestamp: '2026-06-20T18:30:00Z', ip: '189.44.12.22' }
];

const mockCashflowData = [
  { month: 'Jan', inflow: 34000, outflow: 21000, balance: 13000 },
  { month: 'Fev', inflow: 42000, outflow: 28000, balance: 14000 },
  { month: 'Mar', inflow: 38000, outflow: 32000, balance: 6000 },
  { month: 'Abr', inflow: 51000, outflow: 25000, balance: 26000 },
  { month: 'Mai', inflow: 48000, outflow: 29000, balance: 19000 },
  { month: 'Jun', inflow: 52000, outflow: 31000, balance: 21000 }
];

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('vance_session_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [currentView, setCurrentView] = useState('overview');
  const [activeSettingsTab, setActiveSettingsTab] = useState('company');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  const handleNavigate = (view: string) => {
    setCurrentView(view);
    if (view === 'settings') {
      setActiveSettingsTab('company');
    }
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('vance_session_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('vance_session_user');
  };

  // Core application state
  const [appState, setAppState] = useState<AppState>({
    theme: 'dark',
    sidebarOpen: true,
    density: 'standard',
    selectedCompany: {
      cnpj: '12345678000199',
      razaoSocial: 'Vance Soluções de Crescimento LTDA',
      nomeFantasia: 'VANCE',
      regime: 'Simples Nacional',
      minBalanceAlert: 10000.00,
      timezone: 'America/Sao_Paulo',
      certificateUploaded: true,
      certificateExpiry: '21/06/2027'
    }
  });

  // Database lists state
  const [companies, setCompanies] = useState<Company[]>(() => {
    return [
      {
        cnpj: '12345678000199',
        razaoSocial: 'Vance Soluções de Crescimento LTDA',
        nomeFantasia: 'VANCE MATRIZ',
        regime: 'Simples Nacional',
        minBalanceAlert: 10000.00,
        timezone: 'America/Sao_Paulo',
        certificateUploaded: true,
        certificateExpiry: '21/06/2027'
      },
      {
        cnpj: '98765432000100',
        razaoSocial: 'Vance Distribuidora de Ativos Importados S.A.',
        nomeFantasia: 'VANCE DISTRIBUIDORA',
        regime: 'Lucro Real',
        minBalanceAlert: 25000.00,
        timezone: 'America/Sao_Paulo',
        certificateUploaded: false
      }
    ];
  });
  const [selectedCompanyCnpj, setSelectedCompanyCnpj] = useState<string>('consolidado');

  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [pluggyAccounts, setPluggyAccounts] = useState<PluggyAccount[]>(initialPluggyAccounts);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>(initialWebhookLogs);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialAuditLogs);

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

  // Sync state setting properties on document Root for dark/light mode switches
  const handleToggleTheme = () => {
    const nextTheme = appState.theme === 'dark' ? 'light' : 'dark';
    handleUpdateState({ theme: nextTheme });
  };

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', appState.theme);
  }, [appState.theme]);

  // Partial settings updator
  const handleUpdateState = (newState: Partial<AppState>) => {
    setAppState(prev => ({ ...prev, ...newState }));
  };

  // Dispatchers
  const handleAddTransaction = (tx: Transaction) => {
    const txWithCnpj = {
      ...tx,
      companyCnpj: tx.companyCnpj || (selectedCompanyCnpj === 'consolidado' ? companies[0]?.cnpj : selectedCompanyCnpj) || '12345678000199'
    };
    setTransactions(prev => [txWithCnpj, ...prev]);
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

  const handleSessionRoleChange = (newRole: any) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, role: newRole };
      setCurrentUser(updatedUser);
      localStorage.setItem('vance_session_user', JSON.stringify(updatedUser));
      
      // sync with the users list too
      setUsers(prev => prev.map(u => {
        if (u.id === currentUser.id) {
          return { ...u, role: newRole };
        }
        return u;
      }));
    }
  };

  const handleAddPluggyAccount = (acc: PluggyAccount) => {
    setPluggyAccounts(prev => [...prev, acc]);
  };

  const handleRemovePluggyAccount = (id: string) => {
    setPluggyAccounts(prev => prev.filter(acc => acc.id !== id));
  };

  const activeAlertCount = alerts.filter(a => a.status === 'active').length;

  if (!currentUser) {
    return (
      <Login
        users={users}
        onAddUser={handleAddUser}
        onLogin={handleLogin}
      />
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
              onAddCompany={(company) => setCompanies(prev => [...prev, company])}
              onRemoveCompany={(cnpj) => {
                setCompanies(prev => prev.filter(c => c.cnpj !== cnpj));
                if (selectedCompanyCnpj === cnpj) {
                  setSelectedCompanyCnpj('consolidado');
                }
              }}
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
