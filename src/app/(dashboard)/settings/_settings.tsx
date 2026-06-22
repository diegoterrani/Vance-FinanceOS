'use client';

import React, { useState } from 'react';
import { formatCNPJ, formatCurrency, formatDate, formatDateTime } from '@/lib/formatters';
import { AppState, User, PluggyAccount, WebhookLog, AuditLog } from '@/lib/types';
import {
  Building2, Users, Cable, CreditCard, Bell, KeyRound, Eye, ShieldCheck, Palette,
  Upload, Plus, Shield, RefreshCw, Smartphone, Key, Lock, Mail, Trash2, Clipboard,
  Clock, CheckCircle, AlertTriangle, FileText, Download, Check, HelpCircle, Save, ExternalLink
} from 'lucide-react';

interface SettingsProps {
  appState: AppState;
  onUpdateState: (newState: Partial<AppState>) => void;
  users: User[];
  onAddUser: (user: User) => void;
  onUpdateUserRole: (id: string, role: any) => void;
  onToggleUserStatus: (id: string) => void;
  pluggyAccounts: PluggyAccount[];
  onAddPluggyAccount: (acc: PluggyAccount) => void;
  webhookLogs: WebhookLog[];
  auditLogs: AuditLog[];
}

export default function Settings({
  appState,
  onUpdateState,
  users,
  onAddUser,
  onUpdateUserRole,
  onToggleUserStatus,
  pluggyAccounts,
  onAddPluggyAccount,
  webhookLogs,
  auditLogs
}: SettingsProps) {
  // Lateral tabs
  const [activeTab, setActiveTab] = useState<
    'company' | 'users' | 'integrations' | 'billing' | 'notifications' | 'security' | 'privacy' | 'appearance'
  >('company');

  // Success save state toast feedback
  const [saveSuccess, setSaveSuccess] = useState(false);
  const triggerSaveSuccess = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  // ----------------------------------------------------
  // 1. TABS: COMPANY CONFIGS
  // ----------------------------------------------------
  const [compName, setCompName] = useState(appState.selectedCompany.nomeFantasia);
  const [compCnpj, setCompCnpj] = useState(appState.selectedCompany.cnpj);
  const [compRegime, setCompRegime] = useState(appState.selectedCompany.regime);
  const [compLimit, setCompLimit] = useState(appState.selectedCompany.minBalanceAlert);
  const [compTimezone, setCompTimezone] = useState(appState.selectedCompany.timezone);
  const [certPass, setCertPass] = useState('');
  const [uploadingCert, setUploadingCert] = useState(false);
  const [isCertUploaded, setIsCertUploaded] = useState(appState.selectedCompany.certificateUploaded);

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateState({
      selectedCompany: {
        ...appState.selectedCompany,
        nomeFantasia: compName,
        cnpj: compCnpj,
        regime: compRegime,
        minBalanceAlert: Number(compLimit),
        timezone: compTimezone,
        certificateUploaded: isCertUploaded
      }
    });
    triggerSaveSuccess();
  };

  const handleCertSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadingCert(true);
    setTimeout(() => {
      setUploadingCert(false);
      setIsCertUploaded(true);
      onUpdateState({
        selectedCompany: {
          ...appState.selectedCompany,
          certificateUploaded: true,
          certificateExpiry: '2027-06-21' // 1 year out
        }
      });
    }, 1300);
  };

  // ----------------------------------------------------
  // 2. TABS: USERS MANAGEMENT & INVITE
  // ----------------------------------------------------
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<any>('analista');
  const [showInviteModal, setShowInviteModal] = useState(false);

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteName) return;

    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: inviteName,
      email: inviteEmail,
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100',
      role: inviteRole,
      status: 'pending',
      lastActive: 'Pendente',
      lastIp: '—',
      device: 'E-mail enviado'
    };

    onAddUser(newUser);
    setInviteEmail('');
    setInviteName('');
    setShowInviteModal(false);
    triggerSaveSuccess();
  };

  // ----------------------------------------------------
  // 3. TABS: INTEGRATIONS & WEBHOOKS
  // ----------------------------------------------------
  const [webhookUrl, setWebhookUrl] = useState('https://meu-sistema-erp.com/webhooks/vance');
  const [webhookEvents, setWebhookEvents] = useState<Record<string, boolean>>({
    'cnab.processed': true,
    'payment.overdue': false,
    'balance.alert': true,
    'invoice.created': false
  });

  const handleSaveWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    triggerSaveSuccess();
  };

  const handleTogglePluggy = () => {
    if (pluggyAccounts.length > 0) {
      // Clear all
      onUpdateState({ selectedCompany: { ...appState.selectedCompany } });
    } else {
      // Add standard Itaú
      onAddPluggyAccount({
        id: 'plug-itau',
        name: 'Conta Corrente Corporativa',
        type: 'checking',
        bankName: 'Itaú Unibanco S.A.',
        balance: 48320.00,
        syncStatus: 'success',
        lastSync: '06:00 Hoje'
      });
    }
  };

  // ----------------------------------------------------
  // 4. TABS: BILLING & LIMITS
  // ----------------------------------------------------
  // Local plan data helper
  const billingPlan = {
    name: 'Vance Scale Pro Max',
    price: 349.90,
    nextPayment: '05/07/2026',
    limitTransactions: 1000,
    usedTransactions: 512,
  };

  const invoices = [
    { num: 'FAT-2026-05', date: '05/05/2026', value: 349.90, status: 'pago' },
    { num: 'FAT-2026-04', date: '05/04/2026', value: 349.90, status: 'pago' },
    { num: 'FAT-2026-03', date: '05/03/2026', value: 349.90, status: 'pago' }
  ];

  // ----------------------------------------------------
  // 5. TABS: NOTIFICATIONS
  // ----------------------------------------------------
  const [notifRules, setNotifRules] = useState({
    cnab_email: true, cnab_sms: false, cnab_wa: false,
    overdue_email: true, overdue_sms: true, overdue_wa: true,
    balance_email: true, balance_sms: false, balance_wa: true,
    invoice_email: false, invoice_sms: false, invoice_wa: false
  });

  const toggleNotifRule = (key: keyof typeof notifRules) => {
    setNotifRules(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // ----------------------------------------------------
  // 6. TABS: SECURITY & MFA
  // ----------------------------------------------------
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaSecret, setMfaSecret] = useState('JBSWY3DPEHPK3PXP');
  const [totpInput, setTotpInput] = useState('');
  const [activeSessions, setActiveSessions] = useState([
    { id: 'sess-1', device: 'Chrome / macOS Ventura', location: 'São Paulo, BR', current: true },
    { id: 'sess-2', device: 'Safari / iPhone 15 Pro', location: 'Campinas, BR', current: false },
    { id: 'sess-3', device: 'Firefox / Linux Mint', location: 'Belo Horizonte, BR', current: false }
  ]);

  const handleToggleMfa = () => {
    if (mfaEnabled) {
      setMfaEnabled(false);
      setTotpInput('');
    } else {
      if (totpInput === '123456') { // simulate validation
        setMfaEnabled(true);
      } else {
        alert('Código de verificação TOTP inválido no simulador. Código padrão de teste: 123456');
      }
    }
  };

  const handleTerminateSession = (id: string) => {
    setActiveSessions(prev => prev.filter(s => s.id !== id));
  };

  // ----------------------------------------------------
  // 7. TABS: PRIVACY & LGPD
  // ----------------------------------------------------
  const [privacyAgreements, setPrivacyAgreements] = useState({
    analytics: true,
    of_sync: true,
    telemetry: false
  });

  const [lgpdRequestSuccess, setLgpdRequestSuccess] = useState(false);
  const [lgpdTimer, setLgpdTimer] = useState(0);

  const handleExportDataRequest = () => {
    setLgpdRequestSuccess(true);
    setLgpdTimer(3);
    const interval = setInterval(() => {
      setLgpdTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // ----------------------------------------------------
  // 8. TABS: APPEARANCE
  // ----------------------------------------------------
  const [dateStyle, setDateStyle] = useState('BR');
  const [currencySymbolOpt, setCurrencySymbolOpt] = useState('BRL_SYM');

  return (
    <div className="space-y-6">
      
      {/* Save Settings floating message banner feedback toast */}
      {saveSuccess && (
        <div className="fixed bottom-6 right-6 z-50 bg-green-500 text-white px-5 py-3 rounded-lg shadow-2xl flex items-center gap-2 font-semibold text-xs border border-green-600 animate-slide-up">
          <CheckCircle size={15} /> Configuração salva com sucesso
        </div>
      )}

      {/* Main Settings Header */}
      <div className="bg-black/5 p-4 rounded-xl border border-[var(--border-soft)]">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Configurações globais de acesso</h1>
        <p className="text-xs text-[var(--text-secondary)]">Gerenciamento de integrações API, chaves de autenticação de domínio, audit logs e LGPD</p>
      </div>

      {/* Grid: tab selector / layout container */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Left Vertical Sub Navigation Tabs list */}
        <div className="md:col-span-1 space-y-1">
          {[
            { id: 'company', label: 'Dados da Empresa', icon: Building2 },
            { id: 'users', label: 'Usuários e Funções', icon: Users },
            { id: 'integrations', label: 'Integrações Externas', icon: Cable },
            { id: 'billing', label: 'Licença & Cobrança', icon: CreditCard },
            { id: 'notifications', label: 'Notificações Regras', icon: Bell },
            { id: 'security', label: 'Trilha & Segurança', icon: KeyRound },
            { id: 'privacy', label: 'Privacidade LGPD', icon: Shield },
            { id: 'appearance', label: 'Formato & Aparência', icon: Palette }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 hover:bg-[var(--bg-card-hover)] transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-brand/10 text-brand border-l-2 border-brand font-bold'
                    : 'text-[var(--text-secondary)]'
                }`}
              >
                <Icon size={15} /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Right Active sub-tab Content Area */}
        <div className="md:col-span-3 p-6 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] min-h-[400px]">
          
          {/* 1. COMPONENT: TAB COMPANY */}
          {activeTab === 'company' && (
            <form onSubmit={handleSaveCompany} className="space-y-6">
              <div className="border-b border-[var(--border-soft)] pb-3">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Perfil Jurídico da Organização</h3>
                <p className="text-[10px] text-[var(--text-secondary)]">Insira os dados societários para emissão de relatórios oficiais</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="space-y-1">
                  <label className="text-xs text-[var(--text-secondary)] block">Razão Social</label>
                  <input
                    type="text"
                    value={appState.selectedCompany.razaoSocial}
                    disabled
                    className="w-full text-xs px-3 py-2 rounded-lg border border-[var(--border-soft)] bg-black/10 text-[var(--text-muted)] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-[var(--text-secondary)] block">Nome Fantasia (Exibe no Header)</label>
                  <input
                    type="text"
                    value={compName}
                    onChange={(e) => setCompName(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none focus:border-brand"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-[var(--text-secondary)] block">CNPJ Cadastrado</label>
                  <input
                    type="text"
                    value={formatCNPJ(compCnpj)}
                    onChange={(e) => setCompCnpj(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none focus:border-brand font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-[var(--text-secondary)] block">Regime Tributário</label>
                  <select
                    value={compRegime}
                    onChange={(e) => setCompRegime(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none focus:border-brand"
                  >
                    <option value="Simples Nacional">Simples Nacional</option>
                    <option value="Lucro Presumido">Lucro Presumido</option>
                    <option value="Lucro Real">Lucro Real</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-[var(--text-secondary)] block">Timezone</label>
                  <select
                    value={compTimezone}
                    onChange={(e) => setCompTimezone(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none focus:border-brand font-mono"
                  >
                    <option value="America/Sao_Paulo">America/Sao_Paulo (GMT -03:00)</option>
                    <option value="America/Manaus">America/Manaus (GMT -04:00)</option>
                    <option value="UTC">UTC (Universal Time)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-[var(--text-secondary)] block">Limite Mínimo de Margem Alerta (R$)</label>
                  <input
                    type="number"
                    value={compLimit}
                    onChange={(e) => setCompLimit(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none focus:border-brand font-mono"
                  />
                </div>

              </div>

              {/* Certificate A1 section */}
              <div className="p-4 rounded-xl border border-[var(--border-soft)] bg-black/15 space-y-4">
                <div className="flex gap-2">
                  <Lock className="text-brand flex-shrink-0" size={17} />
                  <div>
                    <h4 className="font-bold text-xs text-[var(--text-primary)]">Certificado Digital A1 de Faturamento</h4>
                    <p className="text-[10px] text-[var(--text-secondary)]">Obrigatório para emissão automatizada de NF-e e relatórios na plataforma do NFe.io</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1">
                    <label className="text-xs text-[var(--text-secondary)] block">Senha do arquivo (.pfx / .p12)</label>
                    <input
                      type="password"
                      placeholder="••••••••••••••"
                      value={certPass}
                      onChange={(e) => setCertPass(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none focus:border-brand"
                    />
                  </div>

                  <div className="flex flex-col justify-end">
                    
                    {isCertUploaded ? (
                      <div className="flex justify-between items-center p-2.5 rounded bg-green-500/10 border border-green-500/20 text-xs text-green-500">
                        <span className="flex items-center gap-1.5 font-semibold">
                          <CheckCircle size={14} /> Ativo: Expira em 341 dias
                        </span>
                        <label className="text-[10px] underline hover:text-green-400 cursor-pointer">
                          Substituir
                          <input type="file" onChange={handleCertSelect} className="hidden" />
                        </label>
                      </div>
                    ) : (
                      <label className="w-full text-center border border-dashed border-[var(--border-mid)] hover:border-brand px-4 py-2.5 rounded-lg text-xs text-[var(--text-secondary)] hover:text-brand transition-all cursor-pointer flex items-center justify-center gap-1.5">
                        <Upload size={14} /> {uploadingCert ? 'Carregando arquivo...' : 'Upload Certificado .PFX'}
                        <input type="file" onChange={handleCertSelect} className="hidden" />
                      </label>
                    )}

                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="submit"
                  className="bg-brand hover:bg-[var(--color-brand-light)] text-white px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Save size={13} /> Salvar Alterações
                </button>
              </div>
            </form>
          )}

          {/* 2. COMPONENT: TAB USERS */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              
              <div className="border-b border-[var(--border-soft)] pb-3 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Gestão de Equipe e Roles</h3>
                  <p className="text-[10px] text-[var(--text-secondary)]">Defina as visibilidades e limites de transações financeiras para cada integrante</p>
                </div>
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="bg-brand text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-[var(--color-brand-light)] transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={14} /> Convidar Integrante
                </button>
              </div>

              {/* Invite overlay modal */}
              {showInviteModal && (
                <div className="p-4 rounded-xl border border-teal-500/30 bg-teal-500/5 space-y-4">
                  <span className="font-bold text-xs text-teal-400 flex items-center gap-1.5">
                    <Mail size={13} /> Formulário de Convite de Usuário
                  </span>
                  <form onSubmit={handleSendInvite} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="Nome do integrante"
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                      required
                      className="text-xs px-3 py-2 rounded border border-[var(--border-soft)] bg-[var(--bg-input)]"
                    />
                    <input
                      type="email"
                      placeholder="Email corporativo"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      required
                      className="text-xs px-3 py-2 rounded border border-[var(--border-soft)] bg-[var(--bg-input)] font-mono"
                    />
                    <div className="flex gap-2">
                      <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value as any)}
                        className="text-xs px-2 py-2 rounded border border-[var(--border-soft)] bg-[var(--bg-input)] flex-1"
                      >
                        <option value="viewer">Visualizador</option>
                        <option value="analista">Analista Técnico</option>
                        <option value="tesouraria">Tesoureiro Líder</option>
                        <option value="admin">Administrador Geral</option>
                      </select>
                      <button
                        type="submit"
                        className="bg-brand text-white px-3 font-semibold rounded text-xs hover:bg-[var(--color-brand-light)] cursor-pointer"
                      >
                        Enviar
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowInviteModal(false)}
                        className="p-2 border border-[var(--border-soft)] rounded text-[var(--text-secondary)]"
                      >
                        X
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Team grid list */}
              <div className="space-y-3">
                {users.map(user => (
                  <div
                    key={user.id}
                    className={`p-3 rounded-lg border border-[var(--border-soft)] bg-black/10 flex flex-col sm:flex-row justify-between sm:items-center gap-3 ${
                      user.status === 'inactive' ? 'opacity-40' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-full object-cover border border-[var(--border-soft)]"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-[var(--text-primary)]">{user.name}</span>
                          <span className={`inline-flex px-1.5 py-0.25 font-mono text-[8px] rounded uppercase font-bold ${
                            user.role === 'admin' ? 'bg-red-500/10 text-red-500' :
                            user.role === 'tesouraria' ? 'bg-amber-500/10 text-amber-500' :
                            user.role === 'analista' ? 'bg-teal-500/10 text-teal-500' : 'bg-gray-500/10 text-gray-500'
                          }`}>
                            {user.role}
                          </span>
                        </div>
                        <p className="text-[10px] text-[var(--text-secondary)] font-mono">{user.email}</p>
                      </div>
                    </div>

                    {/* Metadata login info */}
                    <div className="font-mono text-[10px] text-[var(--text-secondary)] text-left sm:text-right">
                      <p>Ult. Atividade: {user.lastActive}</p>
                      <p>IP: {user.lastIp} | {user.device}</p>
                    </div>

                    {/* Role switcher + activate/deactivate switch */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <select
                        value={user.role}
                        onChange={(e) => onUpdateUserRole(user.id, e.target.value)}
                        className="text-[10px] px-2 py-1 rounded border border-[var(--border-soft)] bg-[var(--bg-input)]"
                      >
                        <option value="viewer">Viewer</option>
                        <option value="analista">Analista</option>
                        <option value="tesouraria">Tesoureiro</option>
                        <option value="admin">Admin</option>
                      </select>

                      <button
                        onClick={() => onToggleUserStatus(user.id)}
                        className={`px-2.5 py-1 rounded font-mono font-bold text-[9px] uppercase cursor-pointer ${
                          user.status === 'active'
                            ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                            : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                        }`}
                      >
                        {user.status === 'active' ? 'Ativo' : 'Inativo'}
                      </button>
                    </div>

                  </div>
                ))}
              </div>

            </div>
          )}

          {/* 3. COMPONENT: TAB INTEGRATIONS */}
          {activeTab === 'integrations' && (
            <div className="space-y-6">
              
              <div className="border-b border-[var(--border-soft)] pb-3">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Conectividade &amp; APIs</h3>
                <p className="text-[10px] text-[var(--text-secondary)]">Gerencie suas conexões Open Finance e parametrizações de webhook externas</p>
              </div>

              {/* Pluggy visual card */}
              <div className="p-4 rounded-xl border border-[var(--border-soft)] bg-black/15 grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
                <div className="sm:col-span-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                    <h4 className="font-bold text-xs text-[var(--text-primary)]">Open Finance Sync (Pluggy SDK)</h4>
                  </div>
                  <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">
                    Sincronização instantânea e autêntica de extrato unificado de contas de pessoa jurídica (Itaú, Banco do Brasil, Bradesco). Sorteando saldo operacional a cada 30 min.
                  </p>
                  <p className="font-mono text-[9px] text-[var(--text-muted)]">
                    Contas sincronizadas: {pluggyAccounts.map(p => `${p.bankName} (R$ ${p.balance})`).join(', ') || 'Nenhuma'}
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleTogglePluggy}
                    type="button"
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                      pluggyAccounts.length > 0
                        ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20'
                        : 'bg-brand text-white hover:bg-[var(--color-brand-light)]'
                    }`}
                  >
                    {pluggyAccounts.length > 0 ? 'Revogar Acesso' : 'Conectar Conta'}
                  </button>
                </div>
              </div>

              {/* NFe / SeS integration state */}
              <div className="p-4 rounded-xl border border-[var(--border-soft)] bg-black/15 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="space-y-1">
                  <h4 className="font-bold text-xs text-[var(--text-primary)]">Faturamento Automatizado (NFe.io)</h4>
                  <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">Consumo direto da SEFAZ para registro e emissão síncrona de Notas Fiscais Eletrônicas de Serviços.</p>
                </div>
                <span className="px-2 py-0.5 rounded font-mono text-[9px] font-bold uppercase bg-green-500/15 text-green-500 border border-green-500/20 align-middle">
                  CONEXÃO ADQUIRIDA
                </span>
              </div>

              {/* Webhook configurator */}
              <form onSubmit={handleSaveWebhook} className="space-y-4 pt-2 border-t border-[var(--border-soft)]">
                <div>
                  <h4 className="font-bold text-xs text-[var(--text-primary)]">URL do Webhook do Cliente (Para ERPs)</h4>
                  <p className="text-[10px] text-[var(--text-secondary)]">Dispare notificações em tempo real para o seu próprio sistema ou ferramenta de automação</p>
                </div>

                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      className="flex-1 text-xs px-3 py-2 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none focus:border-brand font-mono"
                    />
                    <button
                      type="submit"
                      className="bg-brand text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-[var(--color-brand-light)] cursor-pointer"
                    >
                      Atualizar
                    </button>
                  </div>

                  {/* Webhook events checklist */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                    {Object.entries(webhookEvents).map(([evt, enabled]) => (
                      <label key={evt} className="flex items-center gap-2 text-[10px] text-[var(--text-secondary)] cursor-pointer bg-black/10 p-2 rounded border border-[var(--border-soft)]">
                        <input
                          type="checkbox"
                          checked={enabled}
                          onChange={() => setWebhookEvents(prev => ({ ...prev, [evt]: !prev[evt] as any }))}
                          className="accent-brand"
                        />
                        <span className="font-mono">{evt}</span>
                      </label>
                    ))}
                  </div>

                </div>

                {/* Webhook logs mock table */}
                <div className="space-y-1.5 pt-2">
                  <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)]">Log recente de envios</span>
                  <div className="max-h-24 overflow-y-auto divide-y divide-[var(--border-soft)] bg-black/20 p-2 rounded border border-[var(--border-soft)] text-[10px] font-mono">
                    {webhookLogs.map(log => (
                      <div key={log.id} className="py-1 flex justify-between items-center text-[9px]">
                        <span className="text-[var(--text-muted)]">{log.timestamp}</span>
                        <span className="text-[var(--text-primary)] truncate max-w-[150px]">{log.event}</span>
                        <span className={log.status === 'success' ? 'text-green-500' : 'text-red-500'}>
                          {log.statusCode} ({log.duration}ms)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </form>

            </div>
          )}

          {/* 4. COMPONENT: TAB BILLING */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              
              <div className="border-b border-[var(--border-soft)] pb-3">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Gestão do Plano &amp; Quotas</h3>
                <p className="text-[10px] text-[var(--text-secondary)]">Acompanhe seu consumo proporcional mensal de faturamento e extrato bancário</p>
              </div>

              {/* License detail */}
              <div className="p-4 rounded-xl border border-teal-500/20 bg-teal-500/5 flex flex-col sm:flex-row justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase tracking-widest font-black text-brand bg-teal-500/10 px-1.5 py-0.5 rounded">Plano Premium Escala</span>
                  <p className="font-bold text-sm text-[var(--text-primary)]">{billingPlan.name}</p>
                  <p className="text-xs text-[var(--text-secondary)]">Valor recorrente: <strong>{formatCurrency(billingPlan.price)} / mês</strong></p>
                  <p className="text-[10px] text-[var(--text-muted)]">Próximo débito síncrono no boleto em {billingPlan.nextPayment}</p>
                </div>
                <div className="flex sm:flex-col justify-center gap-2">
                  <button className="bg-brand text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-[var(--color-brand-light)] transition-all cursor-pointer">
                    Trocar Plano
                  </button>
                </div>
              </div>

              {/* Progress dynamic limits */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[var(--text-secondary)]">Lançamentos de retorno processados este mês</span>
                  <span className="font-mono font-bold text-[var(--text-primary)]">{billingPlan.usedTransactions} / {billingPlan.limitTransactions}</span>
                </div>
                <div className="w-full bg-[var(--border-soft)] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-brand h-full rounded-full"
                    style={{ width: `${(billingPlan.usedTransactions / billingPlan.limitTransactions) * 100}%` }}
                  ></div>
                </div>
                <p className="text-[9px] text-[var(--text-muted)] font-mono">Consumo atual: 51.2% da cota contratada. Reset em 14 dias.</p>
              </div>

              {/* Receipts lists mock */}
              <div className="space-y-2.5 pt-2 border-t border-[var(--border-soft)]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Faturas Recentes (Liquidadas via Asaas)</h4>
                <div className="space-y-2 text-xs">
                  {invoices.map(inv => (
                    <div key={inv.num} className="p-2 bg-black/15 rounded border border-[var(--border-soft)] flex justify-between items-center font-mono">
                      <div>
                        <span className="font-bold text-[var(--text-primary)]">{inv.num}</span>
                        <span className="text-[10px] text-[var(--text-muted)] ml-3">Processado em {inv.date}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-green-500 uppercase font-black text-[9px] bg-green-500/10 px-1 py-0.25 rounded">PAGO</span>
                        <span>{formatCurrency(inv.value)}</span>
                        <button className="text-teal-500 hover:underline flex items-center gap-0.5 text-[11px] font-sans cursor-pointer">
                          <Download size={11} /> PDF/XML
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* 5. COMPONENT: TAB NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              
              <div className="border-b border-[var(--border-soft)] pb-3">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Canais de Transmissão de Notificações</h3>
                <p className="text-[10px] text-[var(--text-secondary)]">Gerencie onde e quando cada colaborador será acionado</p>
              </div>

              {/* Table check matrix */}
              <div className="overflow-x-auto text-xs">
                <table className="w-full dense-table border-collapse text-left">
                  <thead>
                    <tr>
                      <th>Acontecimentos Operacionais</th>
                      <th className="text-center">E-mail</th>
                      <th className="text-center">SMS</th>
                      <th className="text-center">WhatsApp Alertas</th>
                    </tr>
                  </thead>
                  <tbody>
                    
                    <tr>
                      <td>Mapeamento do extrato CNAB concluído</td>
                      <td className="text-center">
                        <input
                          type="checkbox"
                          checked={notifRules.cnab_email}
                          onChange={() => toggleNotifRule('cnab_email')}
                          className="accent-brand"
                        />
                      </td>
                      <td className="text-center">
                        <input
                          type="checkbox"
                          checked={notifRules.cnab_sms}
                          onChange={() => toggleNotifRule('cnab_sms')}
                          className="accent-brand"
                        />
                      </td>
                      <td className="text-center">
                        <input
                          type="checkbox"
                          checked={notifRules.cnab_wa}
                          onChange={() => toggleNotifRule('cnab_wa')}
                          className="accent-brand"
                        />
                      </td>
                    </tr>

                    <tr>
                      <td>Previsão de títulos vencidos sem pagamento</td>
                      <td className="text-center">
                        <input
                          type="checkbox"
                          checked={notifRules.overdue_email}
                          onChange={() => toggleNotifRule('overdue_email')}
                          className="accent-brand"
                        />
                      </td>
                      <td className="text-center">
                        <input
                          type="checkbox"
                          checked={notifRules.overdue_sms}
                          onChange={() => toggleNotifRule('overdue_sms')}
                          className="accent-brand"
                        />
                      </td>
                      <td className="text-center">
                        <input
                          type="checkbox"
                          checked={notifRules.overdue_wa}
                          onChange={() => toggleNotifRule('overdue_wa')}
                          className="accent-brand"
                        />
                      </td>
                    </tr>

                    <tr>
                      <td>Alerta de margem líquida inferior ao limite</td>
                      <td className="text-center">
                        <input
                          type="checkbox"
                          checked={notifRules.balance_email}
                          onChange={() => toggleNotifRule('balance_email')}
                          className="accent-brand"
                        />
                      </td>
                      <td className="text-center">
                        <input
                          type="checkbox"
                          checked={notifRules.balance_sms}
                          onChange={() => toggleNotifRule('balance_sms')}
                          className="accent-brand"
                        />
                      </td>
                      <td className="text-center">
                        <input
                          type="checkbox"
                          checked={notifRules.balance_wa}
                          onChange={() => toggleNotifRule('balance_wa')}
                          className="accent-brand"
                        />
                      </td>
                    </tr>

                    <tr>
                      <td>Quitação de nota fiscal emitida no sistema</td>
                      <td className="text-center">
                        <input
                          type="checkbox"
                          checked={notifRules.invoice_email}
                          onChange={() => toggleNotifRule('invoice_email')}
                          className="accent-brand"
                        />
                      </td>
                      <td className="text-center">
                        <input
                          type="checkbox"
                          checked={notifRules.invoice_sms}
                          onChange={() => toggleNotifRule('invoice_sms')}
                          className="accent-brand"
                        />
                      </td>
                      <td className="text-center">
                        <input
                          type="checkbox"
                          checked={notifRules.invoice_wa}
                          onChange={() => toggleNotifRule('invoice_wa')}
                          className="accent-brand"
                        />
                      </td>
                    </tr>

                  </tbody>
                </table>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={triggerSaveSuccess}
                  className="bg-brand text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-[var(--color-brand-light)] cursor-pointer"
                >
                  Salvar Preferências
                </button>
              </div>

            </div>
          )}

          {/* 6. COMPONENT: TAB SECURITY */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              
              <div className="border-b border-[var(--border-soft)] pb-3">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Políticas de Segurança e Criptografia</h3>
                <p className="text-[10px] text-[var(--text-secondary)]">Revise e mantenha controle permanente sobre a integridade dos acessos ao tenant</p>
              </div>

              {/* MFA TOTP Panel */}
              <div className="p-4 rounded-xl border border-[var(--border-soft)] bg-black/15 space-y-4">
                <div className="flex gap-2">
                  <ShieldCheck className="text-brand flex-shrink-0" size={17} />
                  <div>
                    <h4 className="font-bold text-xs text-[var(--text-primary)]">Autenticação de Duplo Fator (MFA TOTP)</h4>
                    <p className="text-[10px] text-[var(--text-secondary)]">Reforce o acesso à conta exigindo um código gerador temporal secundário (Google Authenticator)</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  {!mfaEnabled && (
                    <div className="bg-white p-2.5 rounded-lg border border-[var(--border-mid)] shadow flex-shrink-0">
                      {/* Simulated QR Code */}
                      <div className="w-24 h-24 bg-neutral-100 flex flex-col items-center justify-center text-[8px] text-[var(--text-muted)] text-center font-mono select-none">
                        <div className="grid grid-cols-4 gap-1 p-1">
                          {[...Array(16)].map((_, i) => (
                            <div key={i} className={`w-3.5 h-3.5 ${i % 3 === 0 ? 'bg-black' : 'bg-transparent'}`} />
                          ))}
                        </div>
                        <span>VANCE CODE</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 flex-1 w-full text-xs">
                    {!mfaEnabled ? (
                      <>
                        <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">
                          1. Escaneie o código QR ou insira a chave secreta: <code className="font-bold font-mono text-teal-400 select-all bg-black/35 px-1 rounded">{mfaSecret}</code>
                        </p>
                        <p className="text-[10px] text-[var(--text-secondary)]">2. Insira o código gerado pelo aplicativo (Código padrão de teste: <code>123456</code>):</p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Ex: 123456"
                            maxLength={6}
                            value={totpInput}
                            onChange={(e) => setTotpInput(e.target.value)}
                            className="bg-[var(--bg-input)] text-[var(--text-primary)] px-3 py-1.5 border border-[var(--border-soft)] rounded text-xs text-center w-28 font-mono outline-none"
                          />
                          <button
                            type="button"
                            onClick={handleToggleMfa}
                            className="bg-brand text-white hover:bg-[var(--color-brand-light)] px-3 text-xs font-semibold rounded cursor-pointer"
                          >
                            Ativar MFA
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="p-3 bg-green-500/10 border border-green-500/20 rounded flex items-center justify-between text-green-500 font-semibold mb-2">
                        <span className="flex items-center gap-1.5"><CheckCircle size={14} /> Autenticação por MFA ativada neste dispositivo.</span>
                        <button
                          type="button"
                          onClick={() => setMfaEnabled(false)}
                          className="text-[10px] underline uppercase"
                        >
                          Remover
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Active user sessions layout */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Sessões Conectadas Ativas</h4>
                <div className="space-y-2 text-xs">
                  {activeSessions.map(sess => (
                    <div key={sess.id} className="p-2.5 bg-black/15 rounded border border-[var(--border-soft)] flex justify-between items-center">
                      <div className="flex gap-2 items-center">
                        <Smartphone size={13} className="text-brand" />
                        <div>
                          <p className="font-semibold text-[var(--text-primary)]">{sess.device}</p>
                          <p className="text-[10px] text-[var(--text-muted)] font-mono">{sess.location}</p>
                        </div>
                      </div>
                      <div>
                        {sess.current ? (
                          <span className="text-[9px] font-mono text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded font-black uppercase">ESSA SESSÃO</span>
                        ) : (
                          <button
                            onClick={() => handleTerminateSession(sess.id)}
                            className="text-[10px] text-red-500 hover:underline cursor-pointer"
                          >
                            Derrubar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Readonly audit log trail table */}
              <div className="space-y-2.5 pt-2 border-t border-[var(--border-soft)]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Histórico de Auditorias de Acesso (Audit Log)</h4>
                <div className="max-h-32 overflow-y-auto divide-y divide-[var(--border-soft)] bg-black/20 p-2.5 rounded border border-[var(--border-soft)] text-[10px] font-mono">
                  {auditLogs.map(log => (
                    <div key={log.id} className="py-1.5 flex justify-between items-center text-[9px] hover:bg-black/10 px-1 rounded">
                      <span className="text-[var(--text-muted)]">{formatDateTime(log.timestamp)}</span>
                      <span className="text-[var(--text-primary)] leading-tight">{log.userName}</span>
                      <span className="font-semibold text-teal-400 truncate max-w-[150px]">{log.action}</span>
                      <span className="text-[var(--text-muted)] italic max-w-[200px] truncate">{log.details}</span>
                      <span className="text-gray-500">{log.ip}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* 7. COMPONENT: TAB PRIVACY */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              
              <div className="border-b border-[var(--border-soft)] pb-3">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Governança Corporativa e Privacidade LGPD</h3>
                <p className="text-[10px] text-[var(--text-secondary)]">Conformidade obrigatória com os termos de consentimento da lei 13.709 (LGPD)</p>
              </div>

              {/* Data checklist map representing our stored details */}
              <div className="p-4 rounded-xl border border-[var(--border-soft)] bg-black/15 space-y-3 text-xs leading-relaxed">
                <span className="font-bold text-xs text-[var(--text-primary)]">Mapa de Inventário de Dados Armazenados</span>
                <p className="text-[10px] text-[var(--text-secondary)]">Para fins de transparência legal do Art. 9 LGPD, os seguintes dados são retidos criptografados neste tenant:</p>
                
                <ul className="list-disc pl-4 space-y-1 text-[10px] text-[var(--text-secondary)] font-mono">
                  <li>Dados Societários e de Faturamento (Razão social, CNPJ, Inscrição estadual, Notas)</li>
                  <li>Dados Bancários de Retorno (Códigos de transação via Open Finance, extrato CNAB)</li>
                  <li>Dados Cadastrais dos Integrantes (Nome social, ID do e-mail corporativo, log de IPs)</li>
                </ul>
              </div>

              {/* LGPD Consent switches */}
              <div className="space-y-3 pt-1 text-xs">
                <span className="font-bold text-xs text-[var(--text-primary)]">Gestão de Consentimentos Vigentes</span>
                
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-2 bg-black/10 rounded border border-[var(--border-soft)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={privacyAgreements.analytics}
                      onChange={() => setPrivacyAgreements(prev => ({ ...prev, analytics: !prev.analytics }))}
                      className="accent-brand"
                    />
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">Dados Estatísticos Anonimizados (Art. 12 LGPD)</p>
                      <p className="text-[9px] text-[var(--text-muted)]">Permite coletar informações globais para calibrar o motor preditivo de fluxo de caixa.</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-2 bg-black/10 rounded border border-[var(--border-soft)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={privacyAgreements.of_sync}
                      onChange={() => setPrivacyAgreements(prev => ({ ...prev, of_sync: !prev.of_sync }))}
                      className="accent-brand"
                    />
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">Sincronização Ativa de Backups Open Finance</p>
                      <p className="text-[9px] text-[var(--text-muted)]">Armazenar backups secundários frios locais das transações para prevenção contra desastres.</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Export visual button */}
              <div className="p-4 rounded-xl border border-blue-500/10 bg-blue-500/5 space-y-3.5">
                <div>
                  <h4 className="font-bold text-xs text-[var(--text-primary)]">Exclusão e Portabilidade Unificada dos Meus Dados</h4>
                  <p className="text-[10px] text-[var(--text-secondary)]">Atendendo ao Artigo 18 da LGPD, você pode requisitar um pacote unificado de todos os seus dados em formato JSON/CSV para portabilidade.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleExportDataRequest}
                    disabled={lgpdRequestSuccess}
                    className="bg-brand text-white px-3 py-1.5 rounded transition-all text-xs font-semibold hover:bg-[var(--color-brand-light)] cursor-pointer disabled:opacity-40"
                  >
                    Solicitar Portabilidade (Art. 18 LGPD)
                  </button>
                  <p className="text-[9px] text-[var(--text-muted)] leading-tight flex-1">
                    Ao solicitar, nosso motor irá compactar os bancos e auditar registros. DPO Responsável do Vance: <a href="mailto:diego.terrani@gmail.com" className="hover:underline text-teal-400 font-bold select-all">diego.terrani@gmail.com</a>
                  </p>
                </div>

                {lgpdRequestSuccess && (
                  <div className="text-[10px] font-mono text-green-500 bg-green-500/10 p-2 rounded border border-green-500/20 flex justify-between items-center animate-fade-in">
                    <span>
                      {lgpdTimer > 0
                        ? `Processando portabilidade no banco de dados... Aguarde ${lgpdTimer}s...`
                        : 'Pacote ZIP de exportação LGPD consolidado com sucesso e encaminhado para diego.terrani@gmail.com.'}
                    </span>
                    {lgpdTimer === 0 && <Download size={13} className="text-green-500 animate-bounce" />}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* 8. COMPONENT: TAB APPEARANCE */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              
              <div className="border-b border-[var(--border-soft)] pb-3">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Preferências Locais de Exibição</h3>
                <p className="text-[10px] text-[var(--text-secondary)]">Ajuste formatos monetários, espaçamentos e layouts de tabelas</p>
              </div>

              <div className="space-y-4">
                
                {/* Theme Selector */}
                <div className="space-y-1.5 text-xs text-[var(--text-secondary)]">
                  <label className="block">Tema Visual da Plataforma (Persistente no Navegador)</label>
                  <div className="grid grid-cols-2 gap-3 max-w-sm">
                    <button
                      type="button"
                      onClick={() => onUpdateState({ theme: 'dark' })}
                      className={`px-3 py-2.5 rounded-lg border text-center font-bold cursor-pointer transition-all ${
                        appState.theme === 'dark'
                          ? 'bg-brand/10 text-brand border-brand'
                          : 'border-[var(--border-soft)] bg-black/10 hover:bg-[var(--bg-card-hover)]'
                      }`}
                    >
                      Dark Mode (Operational)
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateState({ theme: 'light' })}
                      className={`px-3 py-2.5 rounded-lg border text-center font-bold cursor-pointer transition-all ${
                        appState.theme === 'light'
                          ? 'bg-brand/15 text-brand border-brand'
                          : 'border-[var(--border-soft)] bg-black/10 hover:bg-[var(--bg-card-hover)]'
                      }`}
                    >
                      Light Mode (Executivo)
                    </button>
                  </div>
                </div>

                {/* Table Density */}
                <div className="space-y-1.5 text-xs text-[var(--text-secondary)] pt-3 border-t border-[var(--border-soft)]">
                  <label className="block">Densidade das Linhas de Tabelas</label>
                  <div className="flex gap-2">
                    {['compact', 'standard', 'comfortable'].map(dens => (
                      <button
                        key={dens}
                        type="button"
                        onClick={() => onUpdateState({ density: dens as any })}
                        className={`px-3 py-1.5 rounded border text-center transition-all capitalize font-semibold cursor-pointer ${
                          appState.density === dens
                            ? 'bg-brand text-white border-brand'
                            : 'border-[var(--border-soft)] bg-[var(--bg-input)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]'
                        }`}
                      >
                        {dens}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date Formats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[var(--border-soft)] text-xs">
                  <div className="space-y-1.5">
                    <label className="text-[var(--text-secondary)] block">Formato de Data</label>
                    <select
                      value={dateStyle}
                      onChange={(e) => setDateStyle(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none"
                    >
                      <option value="BR">DD/MM/YYYY (Padrão BR)</option>
                      <option value="ISO">YYYY-MM-DD (Padrão ISO Internacional)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[var(--text-secondary)] block">Formatador Monetário</label>
                    <select
                      value={currencySymbolOpt}
                      onChange={(e) => setCurrencySymbolOpt(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none font-mono"
                    >
                      <option value="BRL_SYM">R$ 1.234,56 (Padrão Brasil)</option>
                      <option value="BRL_ISO">BRL 1,234.56 (Padrão Internacional)</option>
                    </select>
                  </div>
                </div>

              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="button"
                  onClick={triggerSaveSuccess}
                  className="bg-brand text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-[var(--color-brand-light)] cursor-pointer"
                >
                  Confirmar Perfil Visual
                </button>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
