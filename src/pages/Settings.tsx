import React, { useState, useEffect } from 'react';
import { formatCNPJ, formatCurrency, formatDate, formatDateTime } from '../lib/formatters';
import { AppState, User, PluggyAccount, WebhookLog, AuditLog, Company } from '../types';
import { hasPermission, getRoleDisplayName } from '../lib/permissions';
import { supabase } from '../lib/supabase';
import {
  Building2, Users, Cable, CreditCard, Bell, KeyRound, Eye, ShieldCheck, Palette,
  Upload, Plus, Shield, RefreshCw, Smartphone, Key, Lock, Mail, Trash2, Clipboard,
  Clock, CheckCircle, AlertTriangle, FileText, Download, Check, HelpCircle, Save, ExternalLink,
  Globe, Server, Zap, Loader2, PlayCircle, Send, Terminal, Activity, Network, Database, ShieldAlert
} from 'lucide-react';

interface TestLog {
  time: string;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
}

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
  onOpenSettingsModal?: () => void;
  companies: Company[];
  onAddCompany: (c: Company) => void;
  onUpdateCompany?: (c: Company) => void;
  onRemoveCompany: (cnpj: string) => void;
  onRemovePluggyAccount: (id: string) => void;
  activeSettingsTab?: string;
  currentUser?: User;
  integrationSettings?: any[];
  onSaveIntegration?: (kind: string, ref: string, config: any, status?: string) => void;
  invites?: any[];
  onInvite?: (invite: { email: string; name?: string; role: string }) => void;
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
  auditLogs,
  onOpenSettingsModal,
  companies,
  onAddCompany,
  onUpdateCompany,
  onRemoveCompany,
  onRemovePluggyAccount,
  activeSettingsTab,
  currentUser,
  integrationSettings,
  onSaveIntegration,
  invites,
  onInvite
}: SettingsProps) {
  // Lateral tabs
  const [activeTab, setActiveTab] = useState<
    | 'company'
    | 'companies-cnpj'
    | 'users'
    | 'bank-api'
    | 'multiple-accounts'
    | 'erp-integration'
    | 'integrations'
    | 'billing'
    | 'notifications'
    | 'security'
    | 'privacy'
    | 'appearance'
  >('company');

  // Sync activeTab with activeSettingsTab prop when it changes
  useEffect(() => {
    if (activeSettingsTab) {
      setActiveTab(activeSettingsTab as any);
    }
  }, [activeSettingsTab]);

  // Success save state toast feedback
  const [saveSuccess, setSaveSuccess] = useState(false);
  const triggerSaveSuccess = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const canManageUsers = currentUser ? hasPermission(currentUser.role, 'canManageUsers') : false;
  const canManageSettings = currentUser ? hasPermission(currentUser.role, 'canManageSettings') : true;

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
    if (!canManageSettings) {
      alert('Erro: Seu cargo não possui permissão para alterar as configurações do inquilino.');
      return;
    }
    const updatedCompany = {
      ...appState.selectedCompany,
      nomeFantasia: compName,
      regime: compRegime,
      minBalanceAlert: Number(compLimit),
      timezone: compTimezone,
      certificateUploaded: isCertUploaded
    };
    onUpdateState({ selectedCompany: updatedCompany });
    onUpdateCompany?.(updatedCompany); // persist to Supabase (cnpj is the PK, not edited)
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
    if (!canManageUsers) {
      alert('Erro: Apenas Administradores podem convidar novos usuários.');
      return;
    }
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

    onInvite?.({ email: inviteEmail, name: inviteName, role: inviteRole });
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
  const [webhookEvents, setWebhookEvents] = useState({
    'cnab.processed': true,
    'payment.overdue': false,
    'balance.alert': true,
    'invoice.created': false
  });

  const handleSaveWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveIntegration?.('webhook', '', { url: webhookUrl, events: webhookEvents }, 'configured');
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
    setNotifRules(prev => {
      const next = { ...prev, [key]: !prev[key] };
      onSaveIntegration?.('notifications', '', next, 'configured');
      return next;
    });
  };

  // ----------------------------------------------------
  // 6. TABS: SECURITY & MFA
  // ----------------------------------------------------
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaSecret, setMfaSecret] = useState('');
  const [mfaFactorId, setMfaFactorId] = useState('');
  const [totpInput, setTotpInput] = useState('');
  const [mfaBusy, setMfaBusy] = useState(false);

  // Real MFA via Supabase Auth: detect verified factor, else enroll a fresh
  // TOTP factor so the secret can be shown to the user.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await supabase.auth.mfa.listFactors();
        const totp = (data?.totp || []) as any[];
        const verified = totp.find(f => f.status === 'verified');
        if (verified) {
          if (active) { setMfaEnabled(true); setMfaFactorId(verified.id); }
          return;
        }
        for (const f of totp.filter(f => f.status === 'unverified')) {
          try { await supabase.auth.mfa.unenroll({ factorId: f.id }); } catch { /* ignore */ }
        }
        const { data: en, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
        if (!error && en && active) {
          setMfaFactorId(en.id);
          setMfaSecret((en as any).totp?.secret || '');
        }
      } catch { /* MFA may be unavailable; ignore */ }
    })();
    return () => { active = false; };
  }, []);

  const handleToggleMfa = async () => {
    if (mfaBusy) return;
    if (mfaEnabled) {
      setMfaBusy(true);
      try {
        if (mfaFactorId) await supabase.auth.mfa.unenroll({ factorId: mfaFactorId });
        setMfaEnabled(false); setMfaSecret(''); setMfaFactorId(''); setTotpInput('');
      } catch (e: any) {
        alert('Falha ao desativar 2FA: ' + (e?.message || e));
      } finally { setMfaBusy(false); }
      return;
    }
    if (!mfaFactorId) { alert('Aguarde a geração da chave 2FA e recarregue a aba.'); return; }
    if (!/^\d{6}$/.test(totpInput)) { alert('Digite o código de 6 dígitos do seu app autenticador.'); return; }
    setMfaBusy(true);
    try {
      const ch = await supabase.auth.mfa.challenge({ factorId: mfaFactorId });
      if (ch.error) throw ch.error;
      const vr = await supabase.auth.mfa.verify({ factorId: mfaFactorId, challengeId: ch.data.id, code: totpInput });
      if (vr.error) throw vr.error;
      setMfaEnabled(true); setTotpInput('');
    } catch (e: any) {
      alert('Código inválido ou expirado: ' + (e?.message || e));
    } finally { setMfaBusy(false); }
  };

  // Supabase cannot list per-device sessions client-side; show the current one.
  const activeSessions = [
    { id: 'current', device: currentUser?.device || 'Este dispositivo', location: 'Sessão atual', current: true },
  ];

  // Real "sign out everywhere".
  const handleTerminateSession = async (_id?: string) => {
    try { await supabase.auth.signOut({ scope: 'global' } as any); } catch { /* ignore */ }
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

  // Real LGPD export: download a JSON file with the user's accessible data.
  const handleExportDataRequest = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      user: currentUser,
      companies,
      accounts: pluggyAccounts,
      auditLogs,
      webhookLogs,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vance-export-${currentUser?.email || 'dados'}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setLgpdRequestSuccess(true);
    setLgpdTimer(0);
  };

  // ----------------------------------------------------
  // 9. TABS: CONECTIVIDADE PORT (BANK API, MULTIPLE ACCOUNTS, ERP)
  // ----------------------------------------------------
  const [selectedBank, setSelectedBank] = useState('itau');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [certUploaded, setCertUploaded] = useState(false);
  const [bankApiLogs, setBankApiLogs] = useState<TestLog[]>([]);
  const [testingBankApi, setTestingBankApi] = useState(false);

  const [showAddAccountForm, setShowAddAccountForm] = useState(false);
  const [newAccName, setNewAccName] = useState('');
  const [newAccBankName, setNewAccBankName] = useState('Itaú S.A.');
  const [newAccType, setNewAccType] = useState<any>('checking');
  const [newAccBalance, setNewAccBalance] = useState('');
  const [newAccAgency, setNewAccAgency] = useState('');
  const [newAccNumber, setNewAccNumber] = useState('');
  const [newAccCompanyCnpj, setNewAccCompanyCnpj] = useState(() => companies?.[0]?.cnpj || '');

  const [selectedErp, setSelectedErp] = useState('omie');
  const [erpUrl, setErpUrl] = useState('https://api.omie.com.br/api/v1/');
  const [erpToken, setErpToken] = useState('');
  const [erpAppKey, setErpAppKey] = useState('');
  const [syncFrequency, setSyncFrequency] = useState('daily');
  const [syncEntities, setSyncEntities] = useState({
    ap: true,
    ar: true,
    clients_vendors: true,
    bank_statements: false
  });
  const [erpLogs, setErpLogs] = useState<TestLog[]>([]);
  const [testingErp, setTestingErp] = useState(false);
  const [erpStatus, setErpStatus] = useState<'disconnected' | 'connected' | 'error'>('disconnected');

  const [showAddCompanyForm, setShowAddCompanyForm] = useState(false);
  const [newCnpj, setNewCnpj] = useState('');
  const [newRazaoSocial, setNewRazaoSocial] = useState('');
  const [newNomeFantasia, setNewNomeFantasia] = useState('');
  const [newRegime, setNewRegime] = useState('Simples Nacional');
  const [newMinBalance, setNewMinBalance] = useState('10000');

  // Company scope for integration settings (the selected "matriz").
  const settingsCompanyCnpj = appState.selectedCompany?.cnpj || companies?.[0]?.cnpj || '';

  // Hydrate webhook + notification config from the backend.
  useEffect(() => {
    if (!integrationSettings) return;
    const forCo = integrationSettings.filter((s: any) => s.companyCnpj === settingsCompanyCnpj);
    const wh = forCo.find((s: any) => s.kind === 'webhook');
    if (wh?.config) {
      if (wh.config.url) setWebhookUrl(wh.config.url);
      if (wh.config.events) setWebhookEvents(prev => ({ ...prev, ...wh.config.events }));
    }
    const nt = forCo.find((s: any) => s.kind === 'notifications');
    if (nt?.config && Object.keys(nt.config).length) setNotifRules(prev => ({ ...prev, ...nt.config }));
  }, [integrationSettings, settingsCompanyCnpj]);

  // Hydrate bank-API fields for the currently selected bank.
  useEffect(() => {
    const s = integrationSettings?.find(
      (x: any) => x.companyCnpj === settingsCompanyCnpj && x.kind === 'bank_api' && x.ref === selectedBank,
    );
    setClientId(s?.config?.clientId || '');
    setClientSecret(s?.config?.clientSecret || '');
    setCertUploaded(!!s?.config?.certUploaded);
  }, [selectedBank, integrationSettings, settingsCompanyCnpj]);

  // Hydrate ERP fields for the currently selected ERP.
  useEffect(() => {
    const s = integrationSettings?.find(
      (x: any) => x.companyCnpj === settingsCompanyCnpj && x.kind === 'erp' && x.ref === selectedErp,
    );
    if (s?.config) {
      if (s.config.erpUrl) setErpUrl(s.config.erpUrl);
      setErpToken(s.config.erpToken || '');
      setErpAppKey(s.config.erpAppKey || '');
      if (s.config.syncFrequency) setSyncFrequency(s.config.syncFrequency);
      if (s.config.syncEntities) setSyncEntities(prev => ({ ...prev, ...s.config.syncEntities }));
      if (s.status === 'connected' || s.status === 'error' || s.status === 'disconnected') setErpStatus(s.status);
    }
  }, [selectedErp, integrationSettings, settingsCompanyCnpj]);

  const handleTestBankApi = () => {
    if (testingBankApi) return;
    setTestingBankApi(true);
    setBankApiLogs([
      { time: getNowTime(), type: 'info', message: `Iniciando handshake síncrono com API do ${getBankFullName(selectedBank)} PJ...` }
    ]);

    setTimeout(() => {
      setBankApiLogs(prev => [
        ...prev,
        { time: getNowTime(), type: 'info', message: 'Resolvendo endpoint OAuth do gateway de homologação...' },
        { time: getNowTime(), type: 'info', message: `Enviando Credenciais do Cliente: ${clientId ? 'PROVEC_CLIENT_ID' : 'Default Sandbox Token'}` }
      ]);
    }, 600);

    setTimeout(() => {
      if (!clientId && selectedBank !== 'nubank') {
        setBankApiLogs(prev => [
          ...prev,
          { time: getNowTime(), type: 'warning', message: 'Nenhuma chave Client ID informada. Utilizando credencial provisória de testes (Sandbox).' }
        ]);
      }
      setBankApiLogs(prev => [
        ...prev,
        { time: getNowTime(), type: 'info', message: 'Processando certificado digital A1 ICP-Brasil...' },
        { time: getNowTime(), type: 'success', message: 'Autenticação de camada de segurança MTLS efetuada com sucesso.' }
      ]);
    }, 1200);

    setTimeout(() => {
      setBankApiLogs(prev => [
        ...prev,
        { time: getNowTime(), type: 'success', message: 'Conexão API estabelecida de forma síncrona!' },
        { time: getNowTime(), type: 'info', message: `Sincronismo via Webhook API pronto em: https://vance.com.br/api/v1/webhooks/${selectedBank}` }
      ]);
      setTestingBankApi(false);
      onSaveIntegration?.('bank_api', selectedBank, { clientId, clientSecret, certUploaded: certUploaded || true }, 'connected');

      const bankNames: Record<string, string> = {
        itau: 'Itaú Unibanco S.A.',
        bradesco: 'Bradesco Net Empresa',
        bb: 'Banco do Brasil S.A.',
        santander: 'Santander PJ',
        nubank: 'Nubank PJ'
      };
      
      const exists = pluggyAccounts.some(acc => acc.bankName === bankNames[selectedBank]);
      if (!exists) {
        onAddPluggyAccount({
          id: `acc-${Date.now()}`,
          name: 'Conta Corrente Integrada',
          type: 'checking',
          bankName: bankNames[selectedBank] || 'Banco PJ Sincronizado',
          balance: 75000.00,
          syncStatus: 'success',
          lastSync: 'Agora mesmo',
          companyCnpj: companies?.[0]?.cnpj || '12345678000199'
        });
      }
    }, 2000);
  };

  const handleTestErp = async () => {
    if (testingErp) return;
    setTestingErp(true);
    setErpLogs([
      { time: getNowTime(), type: 'info', message: `Conectando ao endpoint REST de ${getErpFullName(selectedErp)}...` }
    ]);

    if (!erpUrl) {
      setErpLogs(prev => [...prev, { time: getNowTime(), type: 'error', message: 'Informe a URL do endpoint do ERP.' }]);
      setErpStatus('error');
      setTestingErp(false);
      return;
    }

    try {
      // Real outbound HTTP request to the configured ERP endpoint.
      const resp = await fetch('/api/test-integration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'erp', url: erpUrl, token: erpToken, appKey: erpAppKey })
      });
      const j = await resp.json();
      setErpLogs(prev => [
        ...prev,
        { time: getNowTime(), type: 'info', message: `Requisição real enviada a: ${erpUrl}` },
        { time: getNowTime(), type: j.ok ? 'success' : 'error', message: `${j.message} (HTTP ${j.status}, ${j.latencyMs}ms)` }
      ]);
      setErpStatus(j.ok ? 'connected' : 'error');
      // Persist config regardless, so it is not lost.
      onSaveIntegration?.('erp', selectedErp, { erpUrl, erpToken, erpAppKey, syncFrequency, syncEntities }, j.ok ? 'connected' : 'error');
    } catch (e: any) {
      setErpLogs(prev => [...prev, { time: getNowTime(), type: 'error', message: `Falha na chamada: ${e?.message || e}` }]);
      setErpStatus('error');
    } finally {
      setTestingErp(false);
    }
  };

  const handleAddAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccName || !newAccBalance) return;

    onAddPluggyAccount({
      id: `acc-${Date.now()}`,
      name: newAccType === 'cash' ? `${newAccName}` : `${newAccName} (${newAccAgency}-${newAccNumber})`,
      type: newAccType,
      bankName: newAccType === 'cash' ? 'Caixa em Dinheiro' : newAccBankName,
      balance: parseFloat(newAccBalance) || 0,
      syncStatus: 'success',
      lastSync: 'Sincronizado agora',
      companyCnpj: newAccCompanyCnpj || companies?.[0]?.cnpj || '12345678000199'
    });

    setNewAccName('');
    setNewAccBalance('');
    setNewAccAgency('');
    setNewAccNumber('');
    setShowAddAccountForm(false);
  };

  const handleAddCompanySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCnpj || !newNomeFantasia || !newRazaoSocial) return;

    const cleanCnpj = newCnpj.replace(/\D/g, '');

    onAddCompany({
      cnpj: cleanCnpj || newCnpj,
      razaoSocial: newRazaoSocial,
      nomeFantasia: newNomeFantasia.toUpperCase(),
      regime: newRegime,
      minBalanceAlert: parseFloat(newMinBalance) || 10000.00,
      timezone: 'America/Sao_Paulo',
      certificateUploaded: false
    });

    setNewCnpj('');
    setNewRazaoSocial('');
    setNewNomeFantasia('');
    setNewRegime('Simples Nacional');
    setShowAddCompanyForm(false);
  };

  const getNowTime = () => {
    return new Date().toLocaleTimeString('pt-BR');
  };

  const getBankFullName = (code: string) => {
    switch (code) {
      case 'itau': return 'Itaú Unibanco S.A.';
      case 'bradesco': return 'Bradesco Net Empresa';
      case 'bb': return 'Banco do Brasil S.A.';
      case 'santander': return 'Santander PJ';
      case 'nubank': return 'Nubank Co-Corporativo PJ';
      default: return 'Banco de Destino PJ';
    }
  };

  const getErpFullName = (code: string) => {
    switch (code) {
      case 'omie': return 'Omie ERP';
      case 'totvs': return 'Totvs Protheus / RM Pro';
      case 'contaazul': return 'Conta Azul';
      case 'bling': return 'Bling ERP';
      case 'custom': return 'REST API Customizada';
      default: return 'Sistema ERP';
    }
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
        <div className="md:col-span-1 space-y-4">
          
          <div className="space-y-1">
            <span className="text-[9px] uppercase tracking-wider font-extrabold text-[var(--text-muted)] px-2 block">Organização</span>
            {[
              { id: 'company', label: 'Dados da Matriz', icon: Building2 },
              { id: 'companies-cnpj', label: 'Gestão de CNPJs / Grupo', icon: Globe },
              { id: 'users', label: 'Usuários e Funções', icon: Users }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2.5 hover:bg-[var(--bg-card-hover)] transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-brand/10 text-brand border-l-2 border-brand font-bold'
                      : 'text-[var(--text-secondary)]'
                  }`}
                >
                  <Icon size={14} /> {tab.label}
                </button>
              );
            })}
          </div>

          <div className="space-y-1">
            <span className="text-[9px] uppercase tracking-wider font-extrabold text-[var(--text-muted)] px-2 block">Conectividade PJ &amp; ERP</span>
            {[
              { id: 'bank-api', label: 'APIs Bancárias PJ', icon: Key },
              { id: 'multiple-accounts', label: 'Contas PJ e Ativos', icon: CreditCard },
              { id: 'erp-integration', label: 'Integração ERP', icon: Network },
              { id: 'integrations', label: 'Webhooks & APIs', icon: Cable }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2.5 hover:bg-[var(--bg-card-hover)] transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-brand/10 text-brand border-l-2 border-brand font-bold'
                      : 'text-[var(--text-secondary)]'
                  }`}
                >
                  <Icon size={14} /> {tab.label}
                </button>
              );
            })}
          </div>

          <div className="space-y-1">
            <span className="text-[9px] uppercase tracking-wider font-extrabold text-[var(--text-muted)] px-2 block">Preferências &amp; Sistema</span>
            {[
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
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2.5 hover:bg-[var(--bg-card-hover)] transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-brand/10 text-brand border-l-2 border-brand font-bold'
                      : 'text-[var(--text-secondary)]'
                  }`}
                >
                  <Icon size={14} /> {tab.label}
                </button>
              );
            })}
          </div>

        </div>

        {/* Right Active sub-tab Content Area */}
        <div className="md:col-span-3 p-6 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] min-h-[400px]">
          
          {/* 1. COMPONENT: TAB COMPANY */}
          {activeTab === 'company' && (
            <form onSubmit={handleSaveCompany} className="space-y-6">
              {!canManageSettings && currentUser && (
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500 text-xs flex items-start gap-2.5 animate-fade-in">
                  <ShieldAlert size={16} className="mt-0.5 flex-shrink-0 text-amber-500" />
                  <div>
                    <p className="font-bold">Acesso Somente Leitura (Cargo: {getRoleDisplayName(currentUser.role)})</p>
                    <p className="text-[10px] text-amber-500/80 mt-0.5">Sua conta atual não possui permissões administrativas para alterar o perfil institucional da organização ou realizar upload de novos certificados digitais (.PFX).</p>
                  </div>
                </div>
              )}
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
                  disabled={!canManageSettings}
                  className="bg-brand hover:bg-[var(--color-brand-light)] text-white px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  title={!canManageSettings ? "Seu cargo não possui permissão para salvar alterações" : "Salvar configurações corporativas"}
                >
                  <Save size={13} /> Salvar Alterações
                </button>
              </div>
            </form>
          )}

          {/* 2. COMPONENT: TAB USERS */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              
              {!canManageUsers && currentUser && (
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500 text-xs flex items-start gap-2.5 animate-fade-in">
                  <ShieldAlert size={16} className="mt-0.5 flex-shrink-0 text-amber-500" />
                  <div>
                    <p className="font-bold">Acesso Somente Leitura (Cargo: {getRoleDisplayName(currentUser.role)})</p>
                    <p className="text-[10px] text-amber-500/80 mt-0.5">Sua conta não possui permissões de administração de equipe. Apenas o <strong>Administrador Geral</strong> pode convidar novos membros, reatribuir cargos ou alterar o status de acesso.</p>
                  </div>
                </div>
              )}

              <div className="border-b border-[var(--border-soft)] pb-3 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Gestão de Equipe e Roles</h3>
                  <p className="text-[10px] text-[var(--text-secondary)]">Defina as visibilidades e limites de transações financeiras para cada integrante</p>
                </div>
                <button
                  onClick={() => setShowInviteModal(true)}
                  disabled={!canManageUsers}
                  className="bg-brand text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-[var(--color-brand-light)] transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  title={!canManageUsers ? "Apenas Administradores podem convidar novos usuários" : "Convidar novo integrante da equipe"}
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
                        disabled={!canManageUsers}
                        className="text-[10px] px-2 py-1 rounded border border-[var(--border-soft)] bg-[var(--bg-input)] disabled:opacity-50 disabled:cursor-not-allowed"
                        title={!canManageUsers ? "Apenas Administradores podem mudar cargos" : "Atribuir cargo"}
                      >
                        <option value="viewer">Viewer</option>
                        <option value="analista">Analista</option>
                        <option value="tesouraria">Tesoureiro</option>
                        <option value="admin">Admin</option>
                      </select>

                      <button
                        onClick={() => onToggleUserStatus(user.id)}
                        disabled={!canManageUsers}
                        className={`px-2.5 py-1 rounded font-mono font-bold text-[9px] uppercase cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                          user.status === 'active'
                            ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                            : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                        }`}
                        title={!canManageUsers ? "Apenas Administradores podem alterar status" : "Ativar/Desativar usuário"}
                      >
                        {user.status === 'active' ? 'Ativo' : 'Inativo'}
                      </button>
                    </div>

                  </div>
                ))}
              </div>

            </div>
          )}

          {/* COMPONENT: TAB COMPANIES CNPJ */}
          {activeTab === 'companies-cnpj' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-start border-b border-[var(--border-soft)] pb-3 gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Gestão de CNPJs / Empresas do Grupo</h3>
                  <p className="text-[10px] text-[var(--text-secondary)] mt-1 leading-relaxed">
                    Gerencie as empresas e CNPJs vinculados a esta conta de cliente para filtrar ou consolidar seus fluxos de contas a pagar e receber.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddCompanyForm(!showAddCompanyForm)}
                  className="px-3 py-1.5 bg-brand text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:bg-brand/90 transition-all shadow-md shrink-0 animate-fade-in"
                >
                  {showAddCompanyForm ? 'Fechar Form' : 'Cadastrar Empresa'}
                  <Plus size={13} />
                </button>
              </div>

              {/* Add Company form */}
              {showAddCompanyForm && (
                <form onSubmit={handleAddCompanySubmit} className="p-4 bg-black/5 rounded-xl border border-[var(--border-soft)] grid grid-cols-1 sm:grid-cols-2 gap-4 animate-slide-up text-xs">
                  <div className="space-y-1">
                    <label className="text-[10px] text-[var(--text-secondary)] uppercase font-semibold">CNPJ</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: 00.000.000/0000-00"
                      value={newCnpj}
                      onChange={(e) => setNewCnpj(e.target.value)}
                      className="w-full bg-[var(--bg-input)] text-[var(--text-primary)] border border-[var(--border-soft)] rounded-lg py-2 px-3 focus:outline-none focus:border-brand font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-[var(--text-secondary)] uppercase font-semibold">Nome Fantasia</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Vance Importadora"
                      value={newNomeFantasia}
                      onChange={(e) => setNewNomeFantasia(e.target.value)}
                      className="w-full bg-[var(--bg-input)] text-[var(--text-primary)] border border-[var(--border-soft)] rounded-lg py-2 px-3 focus:outline-none focus:border-brand"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[10px] text-[var(--text-secondary)] uppercase font-semibold">Razão Social Completa</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Vance Comércio de Importados e Eletrônicos Ltda"
                      value={newRazaoSocial}
                      onChange={(e) => setNewRazaoSocial(e.target.value)}
                      className="w-full bg-[var(--bg-input)] text-[var(--text-primary)] border border-[var(--border-soft)] rounded-lg py-2 px-3 focus:outline-none focus:border-brand"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-[var(--text-secondary)] uppercase font-semibold">Regime Tributário</label>
                    <select
                      value={newRegime}
                      onChange={(e) => setNewRegime(e.target.value)}
                      className="w-full bg-[var(--bg-input)] text-[var(--text-primary)] border border-[var(--border-soft)] rounded-lg py-2 px-3 focus:outline-none focus:border-brand"
                    >
                      <option value="Simples Nacional">Simples Nacional</option>
                      <option value="Lucro Presumido">Lucro Presumido</option>
                      <option value="Lucro Real">Lucro Real</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-[var(--text-secondary)] uppercase font-semibold">Saldo de Caixa Mínimo Alvo (R$)</label>
                    <input
                      type="number"
                      placeholder="10000"
                      value={newMinBalance}
                      onChange={(e) => setNewMinBalance(e.target.value)}
                      className="w-full bg-[var(--bg-input)] text-[var(--text-primary)] border border-[var(--border-soft)] rounded-lg py-2 px-3 focus:outline-none focus:border-brand font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2 flex justify-end pt-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-brand hover:bg-brand/90 text-white rounded-lg font-bold text-xs cursor-pointer shadow-md uppercase font-semibold"
                    >
                      Confirmar Cadastro de CNPJ
                    </button>
                  </div>
                </form>
              )}

              {/* List of registered Companies */}
              <div className="space-y-3">
                <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)]">Empresas / CNPJs Ativos ({companies?.length || 0})</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {companies?.map((comp) => (
                    <div
                      key={comp.cnpj}
                      className="p-4 rounded-xl border border-[var(--border-soft)] bg-black/5 flex justify-between items-center hover:border-[var(--border-strong)] transition-all group animate-fade-in"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          <h4 className="font-bold text-[var(--text-primary)]">{comp.nomeFantasia}</h4>
                        </div>
                        <p className="text-[10px] text-[var(--text-secondary)] font-mono">CNPJ: {comp.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")}</p>
                        <p className="text-[9px] text-[var(--text-muted)] line-clamp-1">{comp.razaoSocial}</p>
                        <span className="inline-block text-[8px] bg-brand/10 text-brand px-1.5 py-0.5 rounded font-mono mt-1 uppercase font-bold">
                          {comp.regime}
                        </span>
                      </div>

                      {companies.length > 1 && (
                        <button
                          type="button"
                          onClick={() => onRemoveCompany(comp.cnpj)}
                          className="opacity-0 group-hover:opacity-100 p-2 rounded hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-all cursor-pointer"
                          title="Remover Empresa"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* COMPONENT: TAB BANK API */}
          {activeTab === 'bank-api' && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-[var(--border-soft)] pb-3">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Registrar Integração Bancária PJ</h3>
                <p className="text-[10px] text-[var(--text-secondary)] mt-1 leading-relaxed">
                  Conecte e assine chaves de API com instituições PJ homologadas no Banco Central do Brasil para sincronização em tempo real de extratos.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Input parameters */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-[var(--text-secondary)]">Instituição Financeira (PJ)</label>
                    <select
                      value={selectedBank}
                      onChange={(e) => setSelectedBank(e.target.value)}
                      className="w-full bg-[var(--bg-input)] text-[var(--text-primary)] border border-[var(--border-soft)] rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-brand"
                    >
                      <option value="itau">Itaú Empresas (APIs K02 / K20)</option>
                      <option value="bradesco">Bradesco PJ API Web</option>
                      <option value="bb">Banco do Brasil Developer PJ</option>
                      <option value="santander">Santander PJ API Link</option>
                      <option value="nubank">Nubank PJ (Sem certificado MTLS)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-[var(--text-secondary)]">Chave do Cliente (Client ID)</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-[var(--text-muted)]">
                        <Key size={12} />
                      </span>
                      <input
                        type="text"
                        placeholder="Insira o Client ID fornecido pelo banco"
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                        className="w-full bg-[var(--bg-input)] text-[var(--text-primary)] border border-[var(--border-soft)] rounded-lg py-2 pl-8 pr-3 text-xs focus:outline-none focus:border-brand font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-[var(--text-secondary)]">Segredo do Cliente (Client Secret)</label>
                    <input
                      type="password"
                      placeholder="••••••••••••••••••••••••"
                      value={clientSecret}
                      onChange={(e) => setClientSecret(e.target.value)}
                      className="w-full bg-[var(--bg-input)] text-[var(--text-primary)] border border-[var(--border-soft)] rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-brand font-mono"
                    />
                  </div>

                  <div className="p-3 bg-black/10 rounded-lg border border-[var(--border-soft)] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-[var(--text-secondary)]">Certificado Digital (A1)</span>
                      {certUploaded && (
                        <span className="text-[9px] text-green-500 font-bold bg-green-500/10 px-1.5 py-0.5 rounded flex items-center gap-1 border border-green-500/20">
                          <Check size={10} /> Carregado
                        </span>
                      )}
                    </div>
                    <p className="text-[9px] text-[var(--text-muted)]">Exigido pela maioria dos bancos brasileiros para MTLS.</p>
                    <button
                      type="button"
                      onClick={() => setCertUploaded(!certUploaded)}
                      className={`w-full py-1.5 text-center rounded-md border text-[10px] font-semibold cursor-pointer transition-colors ${
                        certUploaded
                          ? 'bg-black/10 border-[var(--border-soft)] text-[var(--text-primary)] hover:bg-black/20'
                          : 'bg-brand/10 border-brand/20 text-brand hover:bg-brand/20'
                      }`}
                    >
                      {certUploaded ? 'Remover Certificado' : 'Selecionar Certificado .PFX / .P12'}
                    </button>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={handleTestBankApi}
                      disabled={testingBankApi}
                      className="w-full py-2.5 bg-brand hover:bg-brand/90 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg disabled:opacity-50"
                    >
                      {testingBankApi ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />
                          Conectando...
                        </>
                      ) : (
                        <>
                          <Zap size={13} />
                          Testar Conexão API
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Console logger response */}
                <div className="bg-black/40 rounded-xl border border-[var(--border-soft)] p-4 font-mono flex flex-col justify-between h-[300px]">
                  <div className="space-y-2 flex-1 overflow-y-auto text-[10px]">
                    <div className="flex items-center gap-1.5 text-[var(--text-secondary)] border-b border-[var(--border-soft)] pb-1.5 mb-2 shrink-0">
                      <Terminal size={12} className="text-[var(--text-muted)]" />
                      <span>Console de Depuração API Bancária</span>
                    </div>
                    {bankApiLogs.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center text-[var(--text-muted)] px-4 pt-10">
                        <Activity size={24} className="mb-2 text-[var(--text-muted)] animate-pulse" />
                        <p className="text-[9px]">Aguardando disparo do teste...</p>
                        <p className="text-[8px] text-[var(--text-muted)] mt-1">Preencha os campos e clique em &quot;Testar Conexão API&quot;.</p>
                      </div>
                    ) : (
                      bankApiLogs.map((log, idx) => (
                        <div key={idx} className="space-y-0.5">
                          <span className="text-[var(--text-muted)]">[{log.time}]</span>{' '}
                          <span
                            className={`font-semibold ${
                              log.type === 'success'
                                ? 'text-green-500'
                                : log.type === 'error'
                                ? 'text-red-500'
                                : log.type === 'warning'
                                ? 'text-yellow-500'
                                : 'text-[var(--text-primary)]'
                            }`}
                          >
                            {log.type.toUpperCase()}:
                          </span>{' '}
                          <span className="text-[var(--text-secondary)] leading-relaxed">{log.message}</span>
                        </div>
                      ))
                    )}
                  </div>

                  {bankApiLogs.length > 0 && (
                    <div className="text-[9px] text-[var(--text-muted)] border-t border-[var(--border-soft)] pt-1.5 mt-2 flex justify-between shrink-0">
                      <span>Gateway: VANCE-GATE-V1</span>
                      <span>Latência: ~38ms</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* COMPONENT: TAB MULTIPLE ACCOUNTS */}
          {activeTab === 'multiple-accounts' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-start border-b border-[var(--border-soft)] pb-3 gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Contas Bancárias de Homologação</h3>
                  <p className="text-[10px] text-[var(--text-secondary)] mt-1 leading-relaxed">
                    Defina e gerencie múltiplas contas correntes, poupanças ou de investimentos corporativos da sua empresa.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddAccountForm(!showAddAccountForm)}
                  className="px-3 py-1.5 bg-brand text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:bg-brand/90 transition-all shadow-md shrink-0 animate-fade-in"
                >
                  {showAddAccountForm ? 'Fechar Form' : 'Adicionar Conta'}
                  <Plus size={13} />
                </button>
              </div>

              {/* Add Account form */}
              {showAddAccountForm && (
                <form onSubmit={handleAddAccountSubmit} className="p-4 bg-black/5 rounded-xl border border-[var(--border-soft)] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 animate-slide-up text-xs">
                  <div className="space-y-1 col-span-1 sm:col-span-2 md:col-span-1">
                    <label className="text-[10px] text-[var(--text-secondary)] uppercase font-semibold">Empresa Proprietária (CNPJ)</label>
                    <select
                      value={newAccCompanyCnpj}
                      onChange={(e) => setNewAccCompanyCnpj(e.target.value)}
                      className="w-full bg-[var(--bg-input)] text-[var(--text-primary)] border border-[var(--border-soft)] rounded-lg py-2 px-3 focus:outline-none focus:border-brand"
                    >
                      {companies?.map(c => (
                        <option key={c.cnpj} value={c.cnpj}>{c.nomeFantasia} ({c.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-[var(--text-secondary)] uppercase font-semibold">Tipo de Conta / Ativo</label>
                    <select
                      value={newAccType}
                      onChange={(e) => {
                        setNewAccType(e.target.value as any);
                        if (e.target.value === 'cash') {
                          setNewAccBankName('Caixa em Dinheiro');
                        }
                      }}
                      className="w-full bg-[var(--bg-input)] text-[var(--text-primary)] border border-[var(--border-soft)] rounded-lg py-2 px-3 focus:outline-none focus:border-brand"
                    >
                      <option value="checking">Conta Corrente (Checking)</option>
                      <option value="savings">Poupança / Reserva (Savings)</option>
                      <option value="credit_card">Cartão Corporativo (Credit Card)</option>
                      <option value="investment">Conta de Investimento (Tesouro, CDB, CDI)</option>
                      <option value="cash">Valores em Dinheiro (Dinheiro em Espécie)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-[var(--text-secondary)] uppercase font-semibold">Nome de Apelido da Conta / Caixa</label>
                    <input
                      type="text"
                      required
                      placeholder={newAccType === 'cash' ? "Ex: Caixa Físico Escritório" : "Ex: Conta Operacional Principal"}
                      value={newAccName}
                      onChange={(e) => setNewAccName(e.target.value)}
                      className="w-full bg-[var(--bg-input)] text-[var(--text-primary)] border border-[var(--border-soft)] rounded-lg py-2 px-3 focus:outline-none focus:border-brand"
                    />
                  </div>

                  {newAccType !== 'cash' && (
                    <>
                      <div className="space-y-1">
                        <label className="text-[10px] text-[var(--text-secondary)] uppercase font-semibold">Instituição Bancária</label>
                        <select
                          value={newAccBankName}
                          onChange={(e) => setNewAccBankName(e.target.value)}
                          className="w-full bg-[var(--bg-input)] text-[var(--text-primary)] border border-[var(--border-soft)] rounded-lg py-2 px-3 focus:outline-none focus:border-brand"
                        >
                          <option value="Itaú Unibanco S.A.">Itaú Unibanco S.A.</option>
                          <option value="Bradesco S.A.">Bradesco Net Empresa</option>
                          <option value="Banco do Brasil S.A.">Banco do Brasil S.A.</option>
                          <option value="Santander S.A.">Santander PJ</option>
                          <option value="Nubank PJ">Nubank PJ</option>
                          <option value="XP Investimentos">XP Investimentos</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-[var(--text-secondary)] uppercase font-semibold">Número da Agência</label>
                        <input
                          type="text"
                          placeholder="Ex: 3120"
                          value={newAccAgency}
                          onChange={(e) => setNewAccAgency(e.target.value)}
                          className="w-full bg-[var(--bg-input)] text-[var(--text-primary)] border border-[var(--border-soft)] rounded-lg py-2 px-3 focus:outline-none focus:border-brand font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-[var(--text-secondary)] uppercase font-semibold">Número da Conta &amp; Dígito</label>
                        <input
                          type="text"
                          placeholder="Ex: 48321-9"
                          value={newAccNumber}
                          onChange={(e) => setNewAccNumber(e.target.value)}
                          className="w-full bg-[var(--bg-input)] text-[var(--text-primary)] border border-[var(--border-soft)] rounded-lg py-2 px-3 focus:outline-none focus:border-brand font-mono"
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] text-[var(--text-secondary)] uppercase font-semibold">Saldo Atual / Valor em Caixa (R$)</label>
                    <input
                      type="number"
                      required
                      placeholder="0.00"
                      value={newAccBalance}
                      onChange={(e) => setNewAccBalance(e.target.value)}
                      className="w-full bg-[var(--bg-input)] text-[var(--text-primary)] border border-[var(--border-soft)] rounded-lg py-2 px-3 focus:outline-none focus:border-brand font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2 md:col-span-3 flex justify-end pt-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-brand hover:bg-brand/90 text-white rounded-lg font-bold text-xs cursor-pointer shadow-md uppercase font-semibold"
                    >
                      Salvar Ativo / Conta PJ
                    </button>
                  </div>
                </form>
              )}

              {/* List of registered accounts */}
              <div className="space-y-3">
                <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)]">Contas PJ &amp; Ativos de Caixa Ativos ({pluggyAccounts.length})</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pluggyAccounts.map((acc) => (
                    <div
                      key={acc.id}
                      className="p-4 rounded-xl border border-[var(--border-soft)] bg-black/5 flex justify-between items-start hover:border-[var(--border-strong)] transition-all group animate-fade-in"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${acc.type === 'investment' ? 'bg-amber-500' : acc.type === 'cash' ? 'bg-teal-500' : 'bg-green-500'}`}></span>
                          <h4 className="font-bold text-[var(--text-primary)]">{acc.bankName}</h4>
                        </div>
                        <p className="text-[10px] text-[var(--text-secondary)] font-semibold">{acc.name}</p>
                        <p className="text-[9px] text-[var(--text-muted)] font-medium">
                          Empresa: <span className="text-brand font-bold uppercase">{companies?.find(c => c.cnpj === acc.companyCnpj)?.nomeFantasia || 'VANCE HOLDING'}</span>
                        </p>
                        <p className="font-mono text-xs text-brand font-bold mt-1.5">
                          R$ {acc.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <span className={`text-[8px] border px-1.5 py-0.5 rounded uppercase font-mono font-bold ${
                          acc.type === 'checking' ? 'bg-green-500/10 border-green-500/20 text-green-500' :
                          acc.type === 'savings' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' :
                          acc.type === 'investment' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500 font-extrabold' :
                          acc.type === 'cash' ? 'bg-teal-500/10 border-teal-500/20 text-teal-500 font-extrabold animate-pulse' :
                          'bg-neutral-800 border-neutral-700 text-neutral-400'
                        }`}>
                          {acc.type === 'checking' ? 'C. Corrente' :
                           acc.type === 'savings' ? 'Poupança' :
                           acc.type === 'investment' ? 'Investimento' :
                           acc.type === 'cash' ? 'Dinheiro Físico' :
                           'Cartão'}
                        </span>
                        <button
                          type="button"
                          onClick={() => onRemovePluggyAccount(acc.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-all cursor-pointer"
                          title="Remover conta"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* COMPONENT: TAB ERP INTEGRATION */}
          {activeTab === 'erp-integration' && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-[var(--border-soft)] pb-3">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Sincronização com o ERP Corporativo</h3>
                <p className="text-[10px] text-[var(--text-secondary)] mt-1 leading-relaxed">
                  Sincronize automaticamente contas de contas a pagar (AP) e contas a receber (AR) e as envie direto para a Vance para conciliação em tempo real.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ERP Configuration Form */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-[var(--text-secondary)]">Selecione o Sistema ERP</label>
                    <select
                      value={selectedErp}
                      onChange={(e) => {
                        setSelectedErp(e.target.value);
                        if (e.target.value === 'omie') {
                          setErpUrl('https://api.omie.com.br/api/v1/');
                        } else if (e.target.value === 'totvs') {
                          setErpUrl('https://totvs-on.com/protheus/api/v2/');
                        } else if (e.target.value === 'contaazul') {
                          setErpUrl('https://api.contaazul.com/v1/');
                        } else if (e.target.value === 'bling') {
                          setErpUrl('https://bling.com.br/Api/v3/');
                        } else {
                          setErpUrl('https://api.minhaempresa.com/erp/');
                        }
                      }}
                      className="w-full bg-[var(--bg-input)] text-[var(--text-primary)] border border-[var(--border-soft)] rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-brand"
                    >
                      <option value="omie">Omie ERP (Integração Direta)</option>
                      <option value="totvs">Totvs Protheus / RM Pro</option>
                      <option value="contaazul">Conta Azul (SaaS Web)</option>
                      <option value="bling">Bling ERP (e-Commerce / Vendas)</option>
                      <option value="custom">REST API de ERP Próprio (Customizado)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-[var(--text-secondary)]">Endpoint Base REST API do ERP</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-[var(--text-muted)]">
                        <Server size={12} />
                      </span>
                      <input
                        type="url"
                        value={erpUrl}
                        onChange={(e) => setErpUrl(e.target.value)}
                        className="w-full bg-[var(--bg-input)] text-[var(--text-primary)] border border-[var(--border-soft)] rounded-lg py-2 pl-8 pr-3 text-xs focus:outline-none focus:border-brand font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-[var(--text-secondary)]">App Key / User Token</label>
                      <input
                        type="text"
                        placeholder="Chave do App"
                        value={erpAppKey}
                        onChange={(e) => setErpAppKey(e.target.value)}
                        className="w-full bg-[var(--bg-input)] text-[var(--text-primary)] border border-[var(--border-soft)] rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-brand font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-[var(--text-secondary)]">App Secret / API Secret</label>
                      <input
                        type="password"
                        placeholder="Chave de segurança"
                        value={erpToken}
                        onChange={(e) => setErpToken(e.target.value)}
                        className="w-full bg-[var(--bg-input)] text-[var(--text-primary)] border border-[var(--border-soft)] rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-brand font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-[var(--text-secondary)] block">Sincronizar Mapeamento de Entidades</label>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex items-center gap-2 p-2 rounded bg-black/10 border border-[var(--border-soft)] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={syncEntities.ap}
                          onChange={() => setSyncEntities(p => ({ ...p, ap: !p.ap }))}
                          className="accent-brand"
                        />
                        <span className="text-[10px] text-[var(--text-secondary)]">Contas a Pagar</span>
                      </label>

                      <label className="flex items-center gap-2 p-2 rounded bg-black/10 border border-[var(--border-soft)] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={syncEntities.ar}
                          onChange={() => setSyncEntities(p => ({ ...p, ar: !p.ar }))}
                          className="accent-brand"
                        />
                        <span className="text-[10px] text-[var(--text-secondary)]">Contas a Receber</span>
                      </label>

                      <label className="flex items-center gap-2 p-2 rounded bg-black/10 border border-[var(--border-soft)] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={syncEntities.clients_vendors}
                          onChange={() => setSyncEntities(p => ({ ...p, clients_vendors: !p.clients_vendors }))}
                          className="accent-brand"
                        />
                        <span className="text-[10px] text-[var(--text-secondary)]">Clientes &amp; Fornecedores</span>
                      </label>

                      <label className="flex items-center gap-2 p-2 rounded bg-black/10 border border-[var(--border-soft)] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={syncEntities.bank_statements}
                          onChange={() => setSyncEntities(p => ({ ...p, bank_statements: !p.bank_statements }))}
                          className="accent-brand"
                        />
                        <span className="text-[10px] text-[var(--text-secondary)]">Extratos de Lançamento</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={handleTestErp}
                      disabled={testingErp}
                      className="w-full py-2.5 bg-brand hover:bg-brand/90 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg disabled:opacity-50 font-semibold"
                    >
                      {testingErp ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />
                          Conectando ERP...
                        </>
                      ) : (
                        <>
                          <Server size={13} />
                          Testar Conexão ERP
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* ERP Debug Logger */}
                <div className="bg-black/40 rounded-xl border border-[var(--border-soft)] p-4 font-mono flex flex-col justify-between h-[300px]">
                  <div className="space-y-2 flex-1 overflow-y-auto text-[10px]">
                    <div className="flex items-center justify-between text-[var(--text-secondary)] border-b border-[var(--border-soft)] pb-1.5 mb-2 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <Terminal size={12} className="text-[var(--text-muted)]" />
                        <span>Log de Sincronia de ERP</span>
                      </div>
                      {erpStatus === 'connected' && (
                        <span className="text-[8px] bg-green-500/15 text-green-500 border border-green-500/20 px-1 rounded uppercase font-bold">
                          Ativo
                        </span>
                      )}
                    </div>
                    {erpLogs.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center text-[var(--text-muted)] px-4 pt-10">
                        <Database size={24} className="mb-2 text-[var(--text-muted)]" />
                        <p className="text-[9px]">Aguardando conexão com o ERP...</p>
                        <p className="text-[8px] text-[var(--text-muted)] mt-1">Configure as chaves e clique em &quot;Testar Conexão ERP&quot;.</p>
                      </div>
                    ) : (
                      erpLogs.map((log, idx) => (
                        <div key={idx} className="space-y-0.5 animate-fade-in">
                          <span className="text-[var(--text-muted)]">[{log.time}]</span>{' '}
                          <span
                            className={`font-semibold ${
                              log.type === 'success'
                                ? 'text-green-500'
                                : log.type === 'error'
                                ? 'text-red-500'
                                : log.type === 'warning'
                                ? 'text-yellow-500'
                                : 'text-[var(--text-primary)]'
                            }`}
                          >
                            {log.type.toUpperCase()}:
                          </span>{' '}
                          <span className="text-[var(--text-secondary)] leading-relaxed">{log.message}</span>
                        </div>
                      ))
                    )}
                  </div>

                  {erpStatus === 'connected' && (
                    <div className="p-2 bg-green-500/5 rounded border border-green-500/10 text-[9px] text-green-400 leading-relaxed shrink-0">
                      <strong>Conexão operacional activa!</strong> A Vance sincronizará faturas e pagamentos a cada {syncFrequency === 'daily' ? '24 horas (noturno)' : '1 hora'} de forma autônoma.
                    </div>
                  )}
                </div>
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
