import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  Alert,
  AppState,
  AuditLog,
  Company,
  PluggyAccount,
  Transaction,
  TransactionDirection,
  User,
  UserRole,
  WebhookLog,
} from '../types';
import { formatCNPJ, formatCurrency, formatDate, formatDateTime } from '../lib/formatters';
import { getRoleDisplayName, hasPermission, RolePermissions } from '../lib/permissions';
import { CashflowPoint, ChartCategory, ProjectionPoint, RegistryItem, TestLog } from './app.types';

type ViewName = 'overview' | 'registers' | 'reconciliation' | 'cashflow' | 'alerts' | 'settings';
type AuthTab = 'login' | 'signup' | 'forgot';
type ReconciliationTab = 'pending' | 'auto' | 'resolved';
type SettingsTab =
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
  | 'appearance';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  readonly formatCurrency = formatCurrency;
  readonly formatDate = formatDate;
  readonly formatDateTime = formatDateTime;
  readonly formatCNPJ = formatCNPJ;
  readonly getRoleDisplayName = getRoleDisplayName;
  readonly Math = Math;

  currentUser: User | null = null;
  authTab: AuthTab = 'login';
  authEmail = '';
  authPassword = '';
  authName = '';
  authRole: UserRole = 'analista';
  authError = '';
  authSuccess = '';
  authLoading = false;

  currentView: ViewName = 'overview';
  activeSettingsTab: SettingsTab = 'company';
  sidebarCollapsed = false;
  mobileMenuOpen = false;
  saveSuccess = false;

  appState: AppState = {
    theme: 'dark',
    sidebarOpen: true,
    density: 'standard',
    selectedCompany: {
      cnpj: '12345678000199',
      razaoSocial: 'Vance Soluções de Crescimento LTDA',
      nomeFantasia: 'VANCE',
      regime: 'Simples Nacional',
      minBalanceAlert: 10000,
      timezone: 'America/Sao_Paulo',
      certificateUploaded: true,
      certificateExpiry: '21/06/2027',
    },
  };

  companies: Company[] = [
    {
      cnpj: '12345678000199',
      razaoSocial: 'Vance Soluções de Crescimento LTDA',
      nomeFantasia: 'VANCE MATRIZ',
      regime: 'Simples Nacional',
      minBalanceAlert: 10000,
      timezone: 'America/Sao_Paulo',
      certificateUploaded: true,
      certificateExpiry: '21/06/2027',
    },
    {
      cnpj: '98765432000100',
      razaoSocial: 'Vance Distribuidora de Ativos Importados S.A.',
      nomeFantasia: 'VANCE DISTRIBUIDORA',
      regime: 'Lucro Real',
      minBalanceAlert: 25000,
      timezone: 'America/Sao_Paulo',
      certificateUploaded: false,
    },
  ];
  selectedCompanyCnpj = 'consolidado';

  transactions: Transaction[] = [
    {
      id: 'tx-1',
      description: 'PIX RECEBIDO CONTRATO MENSAL SUITE',
      bank: 'XP Investimentos',
      bankCode: '102',
      direction: 'inflow',
      status: 'matched',
      value: 18200,
      date: '2026-06-21',
      reference: 'PIX EM ENTRADA RECORRENTE',
      category: 'Contratos Clientes',
      score: 0.98,
      companyCnpj: '12345678000199',
    },
    {
      id: 'tx-2',
      description: 'PAGAMENTO FORNECEDOR NUVEM HOSTING',
      bank: 'Itaú Unibanco S.A.',
      bankCode: '341',
      direction: 'outflow',
      status: 'matched',
      value: -4400,
      date: '2026-06-20',
      reference: 'AWS HOSTING CLOUD RUN DEBITO',
      category: 'Sistemas e Softwares',
      score: 0.91,
      companyCnpj: '12345678000199',
    },
    {
      id: 'tx-3',
      description: 'TRANSFERENCIA TED ENTRADA ADIANTAMENTO',
      bank: 'Itaú Unibanco S.A.',
      bankCode: '341',
      direction: 'inflow',
      status: 'pending',
      value: 12500,
      date: '2026-06-21',
      reference: 'TED STRIPE PAYMENTS INBOUND',
      category: 'Contratos Clientes',
      score: 0.78,
      companyCnpj: '12345678000199',
    },
    {
      id: 'tx-4',
      description: 'IMPOSTO GUIA DAS RECOLHIMENTO MENSAL',
      bank: 'Banco do Brasil S.A.',
      bankCode: '001',
      direction: 'outflow',
      status: 'matched',
      value: -10300,
      date: '2026-06-19',
      reference: 'PAGAMENTO GUIA SIMPLES DAS SFN',
      category: 'Impostos e Contribuições',
      score: 0.99,
      companyCnpj: '98765432000100',
    },
    {
      id: 'tx-5',
      description: 'RETIRADA PRO LABORE SOCIO INTERNO',
      bank: 'Itaú Unibanco S.A.',
      bankCode: '341',
      direction: 'outflow',
      status: 'pending',
      value: -8500,
      date: '2026-06-18',
      reference: 'REMUNERACAO PROLABORE MENSAL',
      category: 'Folha de Pagamento',
      score: 0.65,
      companyCnpj: '98765432000100',
    },
    {
      id: 'tx-6',
      description: 'RENDIMENTOS APLICAÇÃO CDI DIÁRIA',
      bank: 'XP Investimentos',
      bankCode: '102',
      direction: 'inflow',
      status: 'matched',
      value: 1840,
      date: '2026-06-17',
      reference: 'CDI XP INVESTIMENTOS CDB LIQUIDO',
      category: 'Juros e Rendimentos',
      score: 0.95,
      companyCnpj: '98765432000100',
    },
  ];

  alerts: Alert[] = [
    {
      id: 'al-1',
      title: 'Saldo Itaú abaixo do limite de segurança',
      description: 'O saldo sincronizado via API Bancária Direta (R$ 4.200,00) está inferior à margem parametrizada de R$ 10.000,00.',
      level: 'critical',
      status: 'active',
      category: 'API Bancária',
      date: '2026-06-21',
      companyCnpj: '12345678000199',
    },
    {
      id: 'al-2',
      title: 'Duplicata Fornecedor vencendo hoje',
      description: 'Título financeiro Silveira Express (R$ 3.100,00) registra vencimento em 21/06 sem conciliação correspondente no extrato bancário.',
      level: 'high',
      status: 'active',
      category: 'Faturamento',
      date: '2026-06-21',
      companyCnpj: '98765432000100',
    },
    {
      id: 'al-3',
      title: 'Sincronização de API Bancária PJ ativa',
      description: 'Contas bancárias sincronizadas perfeitamente com os endpoints de produção à 1 hora atrás.',
      level: 'info',
      status: 'active',
      category: 'Sincronização',
      date: '2026-06-21',
      companyCnpj: '12345678000199',
    },
  ];

  users: User[] = [
    {
      id: 'u-1',
      name: 'Diego Terrani',
      email: 'diego.terrani@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100',
      role: 'admin',
      status: 'active',
      lastActive: 'Agora mesmo',
      lastIp: '177.34.21.198',
      device: 'macOS Chrome 126',
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
      device: 'Windows Edge 125',
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
      device: 'Linux Mint Firefox 112',
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
      device: 'iOS Chrome 126',
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
      device: 'macOS Safari 17.4',
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
      device: 'Windows Firefox 125',
    },
  ];

  pluggyAccounts: PluggyAccount[] = [
    { id: 'acc-itau', name: 'Itaú Unibanco S.A.', type: 'checking', bankName: 'Itaú Corp', balance: 4200, syncStatus: 'success', lastSync: '06:00 Hoje', companyCnpj: '12345678000199' },
    { id: 'acc-xp', name: 'XP Investimentos', type: 'investment', bankName: 'XP Corporate', balance: 44120, syncStatus: 'success', lastSync: '06:00 Hoje', companyCnpj: '12345678000199' },
    { id: 'acc-nubank', name: 'Nubank PJ', type: 'checking', bankName: 'Nubank Co-Corp', balance: 15300, syncStatus: 'success', lastSync: '06:00 Hoje', companyCnpj: '98765432000100' },
    { id: 'acc-cash-1', name: 'Caixa Interno em Espécie', type: 'cash', bankName: 'Caixa Físico', balance: 3800, syncStatus: 'success', lastSync: 'Manual', companyCnpj: '12345678000199' },
  ];

  webhookLogs: WebhookLog[] = [
    { id: 'wh-1', url: 'https://meu-sistema-erp.com/webhooks/vance', event: 'cnab.processed', status: 'success', timestamp: '21/06 14:10', duration: 154, statusCode: 200 },
    { id: 'wh-2', url: 'https://meu-sistema-erp.com/webhooks/vance', event: 'balance.alert', status: 'success', timestamp: '21/06 13:00', duration: 89, statusCode: 200 },
    { id: 'wh-3', url: 'https://meu-sistema-erp.com/webhooks/vance', event: 'cnab.processed', status: 'failed', timestamp: '20/06 09:12', duration: 320, statusCode: 502 },
  ];

  auditLogs: AuditLog[] = [
    { id: 'aud-1', userId: 'u-1', userName: 'Diego Terrani', action: 'CONCILIAÇÃO_AUTO', details: 'Aprovação massiva de 4 lançamentos via CNAB retornado', timestamp: '2026-06-21T14:10:00Z', ip: '177.34.21.198' },
    { id: 'aud-2', userId: 'u-1', userName: 'Diego Terrani', action: 'ATUALIZAR_CERTIFICADO', details: 'Arquivo de faturamento certificado A1 enviado (.pfx)', timestamp: '2026-06-21T12:00:00Z', ip: '177.34.21.198' },
    { id: 'aud-3', userId: 'u-2', userName: 'Mariana Santos', action: 'OPEN_FINANCE_SYNC', details: 'Forçado sincronismo manual nas agências de XP Corp', timestamp: '2026-06-20T18:30:00Z', ip: '189.44.12.22' },
  ];

  cashflowData: CashflowPoint[] = [
    { month: 'Jan', inflow: 34000, outflow: 21000, balance: 13000 },
    { month: 'Fev', inflow: 42000, outflow: 28000, balance: 14000 },
    { month: 'Mar', inflow: 38000, outflow: 32000, balance: 6000 },
    { month: 'Abr', inflow: 51000, outflow: 25000, balance: 26000 },
    { month: 'Mai', inflow: 48000, outflow: 29000, balance: 19000 },
    { month: 'Jun', inflow: 52000, outflow: 31000, balance: 21000 },
  ];

  projectionData: ProjectionPoint[] = [
    { day: '21/06', projected: 48320, lowerBound: 48320, upperBound: 48320 },
    { day: '25/06', projected: 49500, lowerBound: 47100, upperBound: 52000 },
    { day: '29/06', projected: 52100, lowerBound: 48400, upperBound: 55800 },
    { day: '03/07', projected: 47000, lowerBound: 42200, upperBound: 51200 },
    { day: '07/07', projected: 53900, lowerBound: 47500, upperBound: 59300 },
    { day: '11/07', projected: 55000, lowerBound: 48100, upperBound: 61000 },
    { day: '15/07', projected: 58200, lowerBound: 50100, upperBound: 65400 },
    { day: '19/07', projected: 60720, lowerBound: 51300, upperBound: 68900 },
  ];

  incomeCategories: ChartCategory[] = [
    { name: 'Contratos Clientes', value: 38200, color: '#0F7B6C' },
    { name: 'Juros e Rendimentos', value: 7420, color: '#3B82F6' },
    { name: 'Honorários Extra', value: 2700, color: '#10B981' },
  ];

  expenseCategories: ChartCategory[] = [
    { name: 'Fornecedores e Logística', value: 28400, color: '#EF4444' },
    { name: 'Folha de Pagamento', value: 24100, color: '#312E81' },
    { name: 'Impostos e Contribuições', value: 10300, color: '#F59E0B' },
    { name: 'Sistemas e Softwares', value: 4400, color: '#8B5CF6' },
  ];

  registryList: RegistryItem[] = [
    { id: 'reg-1', description: 'CONTRATO ANUAL - GRUPO ALMEIDA', direction: 'inflow', value: 24500, dueDate: '2026-06-25', bank: 'Itaú Unibanco S.A.', category: 'Contratos Clientes', recurrence: 'monthly', status: 'pending', documentNumber: 'NF-6782' },
    { id: 'reg-2', description: 'DIÁRIAS SERVIÇO CONSULTORIA JÚNIOR', direction: 'inflow', value: 4800, dueDate: '2026-06-28', bank: 'XP Investimentos', category: 'Honorários Extra', recurrence: 'single', status: 'pending', documentNumber: 'NF-6789' },
    { id: 'reg-3', description: 'RESERVA SALDO RETIDO STRIPE OUTBOUND', direction: 'inflow', value: 3950, dueDate: '2026-06-30', bank: 'Itaú Unibanco S.A.', category: 'Contratos Clientes', recurrence: 'single', status: 'pending' },
    { id: 'reg-4', description: 'RENOVAÇÃO LICENÇAS MICROSOFT 365', direction: 'outflow', value: -1280, dueDate: '2026-06-24', bank: 'Itaú Unibanco S.A.', category: 'Sistemas e Softwares', recurrence: 'monthly', status: 'pending', documentNumber: 'BOL-5532' },
    { id: 'reg-5', description: 'FORNECEDOR LOGÍSTICA SÃO PAULO', direction: 'outflow', value: -3100, dueDate: '2026-06-25', bank: 'Banco do Brasil S.A.', category: 'Fornecedores e Logística', recurrence: 'single', status: 'pending', documentNumber: 'BOL-7821' },
    { id: 'reg-6', description: 'PARCELAMENTO SIMPLES NACIONAL 04/12', direction: 'outflow', value: -4200, dueDate: '2026-06-28', bank: 'Banco do Brasil S.A.', category: 'Impostos e Contribuições', recurrence: 'monthly', status: 'pending', documentNumber: 'GPS-0412' },
  ];

  navItems: { id: ViewName; label: string; icon: string }[] = [
    { id: 'overview', label: 'Painel', icon: '▣' },
    { id: 'registers', label: 'Pagar/Receber', icon: '▤' },
    { id: 'reconciliation', label: 'Conciliação', icon: '⇄' },
    { id: 'cashflow', label: 'Fluxo de Caixa', icon: '↗' },
    { id: 'alerts', label: 'Alertas', icon: '!' },
    { id: 'settings', label: 'Configurações', icon: '⚙' },
  ];

  roleOptions: UserRole[] = ['viewer', 'analista', 'tesouraria', 'gerencia', 'diretor', 'admin'];
  categoriesInflow = ['Contratos Clientes', 'Juros e Rendimentos', 'Honorários Extra', 'Aportes Sócio'];
  categoriesOutflow = ['Sistemas e Softwares', 'Fornecedores e Logística', 'Folha de Pagamento', 'Impostos e Contribuições', 'Infraestrutura', 'Marketing e Vendas'];

  filterType: 'all' | 'inflow' | 'outflow' = 'all';
  showRegisterForm = false;
  feedbackMessage: string | null = null;
  isImporting = false;
  importError: string | null = null;
  registerDescription = '';
  registerDirection: TransactionDirection = 'inflow';
  registerValue = '';
  registerDueDate = '2026-06-25';
  registerBank = 'Itaú Unibanco S.A.';
  registerCategory = 'Contratos Clientes';
  registerRecurrence: 'single' | 'monthly' | 'yearly' = 'single';
  registerDocumentNumber = '';

  activeReconciliationTab: ReconciliationTab = 'pending';
  reconciliationSearch = '';
  selectedBank = 'all';
  minScore = 0.5;
  onlyAiSuggestions = false;
  selectedTxIds: string[] = [];
  activeDrawerTx: Transaction | null = null;
  uploadProgress: number | null = null;
  parsedLinesLogs: string[] = [];
  isUploading = false;
  isDragOver = false;

  alertLevelFilter = 'all';
  alertCategoryFilter = 'all';

  compName = 'VANCE';
  compCnpj = '12345678000199';
  compRegime = 'Simples Nacional';
  compLimit = 10000;
  compTimezone = 'America/Sao_Paulo';
  certPass = '';
  uploadingCert = false;
  isCertUploaded = true;

  inviteEmail = '';
  inviteName = '';
  inviteRole: UserRole = 'analista';
  showInviteModal = false;

  webhookUrl = 'https://meu-sistema-erp.com/webhooks/vance';
  webhookEvents: Record<string, boolean> = {
    'cnab.processed': true,
    'payment.overdue': false,
    'balance.alert': true,
    'invoice.created': false,
  };

  selectedBankApi = 'itau';
  clientId = '';
  clientSecret = '';
  certUploaded = false;
  bankApiLogs: TestLog[] = [];
  testingBankApi = false;

  showAddAccountForm = false;
  newAccName = '';
  newAccBankName = 'Itaú S.A.';
  newAccType: PluggyAccount['type'] = 'checking';
  newAccBalance = '';
  newAccAgency = '';
  newAccNumber = '';
  newAccCompanyCnpj = '12345678000199';

  selectedErp = 'omie';
  erpUrl = 'https://api.omie.com.br/api/v1/';
  erpToken = '';
  erpAppKey = '';
  syncFrequency = 'daily';
  syncEntities = { ap: true, ar: true, clients_vendors: true, bank_statements: false };
  erpLogs: TestLog[] = [];
  testingErp = false;
  erpStatus: 'disconnected' | 'connected' | 'error' = 'disconnected';

  showAddCompanyForm = false;
  newCnpj = '';
  newRazaoSocial = '';
  newNomeFantasia = '';
  newRegime = 'Simples Nacional';
  newMinBalance = '10000';

  notifRules = {
    cnab_email: true, cnab_sms: false, cnab_wa: false,
    overdue_email: true, overdue_sms: true, overdue_wa: true,
    balance_email: true, balance_sms: false, balance_wa: true,
    invoice_email: false, invoice_sms: false, invoice_wa: false,
  };

  mfaEnabled = false;
  mfaSecret = 'JBSWY3DPEHPK3PXP';
  totpInput = '';
  activeSessions = [
    { id: 'sess-1', device: 'Chrome / macOS Ventura', location: 'São Paulo, BR', current: true },
    { id: 'sess-2', device: 'Safari / iPhone 15 Pro', location: 'Campinas, BR', current: false },
    { id: 'sess-3', device: 'Firefox / Linux Mint', location: 'Belo Horizonte, BR', current: false },
  ];
  privacyAgreements = { analytics: true, of_sync: true, telemetry: false };
  lgpdRequestSuccess = false;
  lgpdTimer = 0;
  dateStyle = 'BR';
  currencySymbolOpt = 'BRL_SYM';

  constructor(private readonly http: HttpClient) {}

  ngOnInit(): void {
    const savedUser = localStorage.getItem('vance_session_user');
    if (savedUser) {
      try {
        this.currentUser = JSON.parse(savedUser);
      } catch {
        this.currentUser = null;
      }
    }
    this.applyTheme();
  }

  get activeAlertCount(): number {
    return this.alerts.filter((alert) => alert.status === 'active').length;
  }

  get selectedCompanyName(): string {
    if (this.selectedCompanyCnpj === 'consolidado') return 'Grupo Vance (Consolidado)';
    return this.companies.find((company) => company.cnpj === this.selectedCompanyCnpj)?.nomeFantasia || 'VANCE';
  }

  get filteredTransactions(): Transaction[] {
    return this.selectedCompanyCnpj === 'consolidado'
      ? this.transactions
      : this.transactions.filter((tx) => tx.companyCnpj === this.selectedCompanyCnpj);
  }

  get filteredAccounts(): PluggyAccount[] {
    return this.selectedCompanyCnpj === 'consolidado'
      ? this.pluggyAccounts
      : this.pluggyAccounts.filter((account) => account.companyCnpj === this.selectedCompanyCnpj);
  }

  get filteredAlerts(): Alert[] {
    return this.selectedCompanyCnpj === 'consolidado'
      ? this.alerts
      : this.alerts.filter((alert) => alert.companyCnpj === this.selectedCompanyCnpj);
  }

  get recentTransactions(): Transaction[] {
    return this.filteredTransactions.slice(0, 5);
  }

  get pendingCount(): number {
    return this.filteredTransactions.filter((tx) => tx.status === 'pending').length;
  }

  get totalReceivables(): number {
    return this.registryList.filter((item) => item.status === 'pending' && item.direction === 'inflow').reduce((sum, item) => sum + item.value, 0);
  }

  get totalPayables(): number {
    return this.registryList.filter((item) => item.status === 'pending' && item.direction === 'outflow').reduce((sum, item) => sum + Math.abs(item.value), 0);
  }

  get canManageUsers(): boolean {
    return this.currentUser ? hasPermission(this.currentUser.role, 'canManageUsers') : false;
  }

  get canManageSettings(): boolean {
    return this.currentUser ? hasPermission(this.currentUser.role, 'canManageSettings') : true;
  }

  get canCreateRegistry(): boolean {
    return this.currentUser ? hasPermission(this.currentUser.role, 'canCreateRegistry') : false;
  }

  get canReconcile(): boolean {
    return this.currentUser ? hasPermission(this.currentUser.role, 'canReconcile') : false;
  }

  get canUploadCnab(): boolean {
    return this.currentUser ? hasPermission(this.currentUser.role, 'canUploadCnab') : false;
  }

  hasCurrentPermission(permission: keyof RolePermissions): boolean {
    return this.currentUser ? hasPermission(this.currentUser.role, permission) : false;
  }

  navigate(view: ViewName): void {
    this.currentView = view;
    this.mobileMenuOpen = false;
    if (view === 'settings') this.activeSettingsTab = 'company';
  }

  openSettingsTab(tab: SettingsTab): void {
    this.currentView = 'settings';
    this.activeSettingsTab = tab;
  }

  viewTitle(): string {
    return this.navItems.find((item) => item.id === this.currentView)?.label || 'Painel';
  }

  handleLogin(): void {
    this.authError = '';
    if (!this.authEmail) {
      this.authError = 'Por favor, informe seu e-mail.';
      return;
    }
    if (!this.authPassword) {
      this.authError = 'Por favor, digite sua senha.';
      return;
    }
    this.authLoading = true;
    setTimeout(() => {
      const foundUser = this.users.find((user) => user.email.toLowerCase() === this.authEmail.toLowerCase());
      if (foundUser) {
        if (foundUser.status === 'inactive') {
          this.authError = 'Esta conta está atualmente desativada. Entre em contato com o suporte.';
          this.authLoading = false;
          return;
        }
        this.setCurrentUser(foundUser);
      } else {
        const name = this.authEmail.split('@')[0].split('.').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
        const customUser: User = {
          id: `u-${Date.now()}`,
          name,
          email: this.authEmail.toLowerCase(),
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100',
          role: 'analista',
          status: 'active',
          lastActive: 'Agora mesmo',
          lastIp: '177.34.21.198',
          device: 'Navegador Web',
        };
        this.users = [...this.users, customUser];
        this.setCurrentUser(customUser);
      }
      this.authLoading = false;
    }, 600);
  }

  handleSignup(): void {
    this.authError = '';
    if (!this.authName) {
      this.authError = 'Por favor, digite seu nome completo.';
      return;
    }
    if (!this.authEmail) {
      this.authError = 'Por favor, informe um e-mail válido.';
      return;
    }
    if (!this.authPassword || this.authPassword.length < 6) {
      this.authError = 'A senha deve conter no mínimo 6 caracteres.';
      return;
    }
    if (this.users.some((user) => user.email.toLowerCase() === this.authEmail.toLowerCase())) {
      this.authError = 'Este e-mail já está em uso.';
      return;
    }
    this.authLoading = true;
    setTimeout(() => {
      const user: User = {
        id: `u-${Date.now()}`,
        name: this.authName,
        email: this.authEmail.toLowerCase(),
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100',
        role: this.authRole,
        status: 'active',
        lastActive: 'Agora mesmo',
        lastIp: '127.0.0.1',
        device: 'Dispositivo Recém Cadastrado',
      };
      this.users = [...this.users, user];
      this.setCurrentUser(user);
      this.authLoading = false;
    }, 800);
  }

  handleForgot(): void {
    this.authError = '';
    this.authSuccess = '';
    if (!this.authEmail) {
      this.authError = 'Por favor, insira o seu e-mail cadastrado.';
      return;
    }
    this.authLoading = true;
    setTimeout(() => {
      this.authSuccess = 'As instruções de recuperação foram enviadas para o e-mail informado.';
      this.authLoading = false;
    }, 1000);
  }

  setCurrentUser(user: User): void {
    this.currentUser = user;
    localStorage.setItem('vance_session_user', JSON.stringify(user));
  }

  logout(): void {
    this.currentUser = null;
    localStorage.removeItem('vance_session_user');
  }

  changeSessionRole(role: UserRole): void {
    if (!this.currentUser) return;
    const updated = { ...this.currentUser, role };
    this.currentUser = updated;
    localStorage.setItem('vance_session_user', JSON.stringify(updated));
    this.users = this.users.map((user) => user.id === updated.id ? { ...user, role } : user);
  }

  toggleTheme(): void {
    this.appState = { ...this.appState, theme: this.appState.theme === 'dark' ? 'light' : 'dark' };
    this.applyTheme();
  }

  applyTheme(): void {
    document.documentElement.setAttribute('data-theme', this.appState.theme);
  }

  updateDensity(density: AppState['density']): void {
    this.appState = { ...this.appState, density };
  }

  filteredRegistryItems(): RegistryItem[] {
    return this.registryList.filter((item) => {
      if (this.filterType === 'inflow' && item.direction !== 'inflow') return false;
      if (this.filterType === 'outflow' && item.direction !== 'outflow') return false;
      return true;
    });
  }

  handleRegisterDirectionChange(direction: TransactionDirection): void {
    this.registerDirection = direction;
    this.registerCategory = direction === 'inflow' ? 'Contratos Clientes' : 'Sistemas e Softwares';
  }

  getOffsetDate(days: number): string {
    const baseline = new Date('2026-06-21');
    baseline.setDate(baseline.getDate() + days);
    return baseline.toISOString().split('T')[0];
  }

  getEndOfMonthDate(): string {
    const baseline = new Date('2026-06-21');
    const end = new Date(baseline.getFullYear(), baseline.getMonth() + 1, 0);
    return end.toISOString().split('T')[0];
  }

  getNextMonthFifth(): string {
    const baseline = new Date('2026-06-21');
    const next = new Date(baseline.getFullYear(), baseline.getMonth() + 1, 5);
    return next.toISOString().split('T')[0];
  }

  async handleFileImport(event: Event): Promise<void> {
    if (!this.canCreateRegistry) {
      this.importError = 'Seu perfil de acesso atual não possui permissão para importar documentos.';
      return;
    }
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.isImporting = true;
    this.importError = null;
    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
      let mimeType = file.type;
      if (fileExt === 'xml' && !mimeType) mimeType = 'text/xml';
      const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'text/xml', 'application/xml'];
      if (!validTypes.includes(mimeType) && !['pdf', 'jpg', 'jpeg', 'png', 'xml'].includes(fileExt)) {
        throw new Error('Formato inválido. Envie apenas arquivos PDF, JPG, PNG ou XML.');
      }
      const fileContent = await this.readFileAsBase64(file);
      const data = await firstValueFrom(this.http.post<any>('/api/import-document', {
        fileName: file.name,
        fileType: mimeType || `application/${fileExt}`,
        fileContent,
      }));
      if (data.description) this.registerDescription = String(data.description).toUpperCase();
      if (data.direction) this.handleRegisterDirectionChange(data.direction);
      if (data.category) {
        const allowed = data.direction === 'outflow' ? this.categoriesOutflow : this.categoriesInflow;
        this.registerCategory = allowed.includes(data.category) ? data.category : this.registerCategory;
      }
      if (data.value) this.registerValue = Math.abs(Number(data.value)).toString();
      if (data.dueDate) this.registerDueDate = data.dueDate;
      if (data.bank) this.registerBank = data.bank;
      if (data.documentNumber) this.registerDocumentNumber = data.documentNumber;
      this.triggerFeedback('Documento importado e campos preenchidos com sucesso!');
      this.showRegisterForm = true;
    } catch (error: any) {
      this.importError = error?.message || 'Erro ao processar documento.';
    } finally {
      this.isImporting = false;
      input.value = '';
    }
  }

  readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(',')[1]);
      reader.onerror = () => reject(new Error('Erro ao ler o arquivo.'));
      reader.readAsDataURL(file);
    });
  }

  createRegistry(): void {
    if (!this.canCreateRegistry) {
      alert(`Erro: Seu perfil de ${this.currentUser ? getRoleDisplayName(this.currentUser.role) : 'visitante'} não tem permissão para criar lançamentos.`);
      return;
    }
    if (!this.registerDescription.trim() || !this.registerValue || Number(this.registerValue) <= 0) return;
    const numericValue = Number(this.registerValue);
    const item: RegistryItem = {
      id: `reg-${Date.now()}`,
      description: this.registerDescription.toUpperCase().trim(),
      direction: this.registerDirection,
      value: this.registerDirection === 'inflow' ? numericValue : -numericValue,
      dueDate: this.registerDueDate,
      bank: this.registerBank,
      category: this.registerCategory,
      recurrence: this.registerRecurrence,
      status: 'pending',
      documentNumber: this.registerDocumentNumber.trim() || undefined,
    };
    this.registryList = [item, ...this.registryList];
    this.registerDescription = '';
    this.registerValue = '';
    this.registerDocumentNumber = '';
    this.showRegisterForm = false;
    this.triggerFeedback('Lançamento previsto cadastrado com sucesso!');
  }

  deleteRegistry(id: string): void {
    if (!this.hasCurrentPermission('canDeleteRegistry')) {
      alert(`Erro: Seu perfil de ${this.currentUser ? getRoleDisplayName(this.currentUser.role) : 'visitante'} não tem permissão para remover lançamentos previstos.`);
      return;
    }
    this.registryList = this.registryList.filter((item) => item.id !== id);
    this.triggerFeedback('Lançamento removido.');
  }

  launchToBank(item: RegistryItem): void {
    if (!this.canCreateRegistry) {
      alert('Erro: perfil sem permissão para lançar extratos.');
      return;
    }
    const tx: Transaction = {
      id: `tx-reg-${Date.now()}`,
      description: item.description,
      bank: item.bank,
      bankCode: item.bank === 'Itaú Unibanco S.A.' ? '341' : item.bank === 'Banco do Brasil S.A.' ? '001' : '102',
      direction: item.direction,
      status: 'pending',
      value: item.value,
      date: item.dueDate,
      reference: item.documentNumber || 'CADASTRO PREVISTO',
      category: item.category,
      score: 0.99,
      companyCnpj: this.selectedCompanyCnpj === 'consolidado' ? this.companies[0]?.cnpj : this.selectedCompanyCnpj,
    };
    this.addTransaction(tx);
    this.registryList = this.registryList.map((reg) => reg.id === item.id ? { ...reg, status: 'realized' } : reg);
    this.triggerFeedback(`Lançamento realizado! "${item.description}" enviado para a fila de conciliação.`);
  }

  addTransaction(tx: Transaction): void {
    const txWithCompany = {
      ...tx,
      companyCnpj: tx.companyCnpj || (this.selectedCompanyCnpj === 'consolidado' ? this.companies[0]?.cnpj : this.selectedCompanyCnpj) || '12345678000199',
    };
    this.transactions = [txWithCompany, ...this.transactions];
    this.auditLogs = [
      {
        id: `aud-${Date.now()}`,
        userId: this.currentUser?.id || 'u-1',
        userName: this.currentUser?.name || 'Diego Terrani',
        action: 'NOVA_TRANSAÇÃO_PARSADA',
        details: `Lançamento inserido no livro caixa: ${tx.description}`,
        timestamp: new Date().toISOString(),
        ip: this.currentUser?.lastIp || '177.34.21.198',
      },
      ...this.auditLogs,
    ];
  }

  updateTransactionStatus(id: string, newStatus: Transaction['status']): void {
    this.transactions = this.transactions.map((tx) => tx.id === id ? { ...tx, status: newStatus } : tx);
    const tx = this.transactions.find((item) => item.id === id);
    this.auditLogs = [
      {
        id: `aud-${Date.now()}`,
        userId: this.currentUser?.id || 'u-1',
        userName: this.currentUser?.name || 'Diego Terrani',
        action: 'ATUALIZAR_STATUS',
        details: `Lancamento "${tx?.description}" remarcado para o status ${newStatus}`,
        timestamp: new Date().toISOString(),
        ip: this.currentUser?.lastIp || '177.34.21.198',
      },
      ...this.auditLogs,
    ];
  }

  filteredReconciliationTransactions(): Transaction[] {
    return this.filteredTransactions.filter((tx) => {
      if (this.activeReconciliationTab === 'pending' && tx.status !== 'pending') return false;
      if (this.activeReconciliationTab === 'auto' && (!tx.score || tx.score < 0.85)) return false;
      if (this.activeReconciliationTab === 'resolved' && tx.status !== 'matched') return false;
      if (this.selectedBank !== 'all' && tx.bank !== this.selectedBank) return false;
      if (tx.score !== undefined && tx.score < this.minScore) return false;
      if (this.onlyAiSuggestions && !tx.score) return false;
      if (this.reconciliationSearch) {
        const query = this.reconciliationSearch.toLowerCase();
        return tx.description.toLowerCase().includes(query) || tx.bank.toLowerCase().includes(query) || tx.reference.toLowerCase().includes(query) || tx.category.toLowerCase().includes(query);
      }
      return true;
    });
  }

  setReconciliationTab(tab: ReconciliationTab): void {
    this.activeReconciliationTab = tab;
    this.selectedTxIds = [];
  }

  toggleSelectAll(checked: boolean): void {
    this.selectedTxIds = checked ? this.filteredReconciliationTransactions().map((tx) => tx.id) : [];
  }

  toggleSelectRow(id: string, checked: boolean): void {
    this.selectedTxIds = checked ? [...this.selectedTxIds, id] : this.selectedTxIds.filter((txId) => txId !== id);
  }

  handleCnabFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.simulateParsing(file.name, file.size);
    input.value = '';
  }

  handleDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    const file = event.dataTransfer?.files?.[0];
    if (file) this.simulateParsing(file.name, file.size);
  }

  simulateParsing(filename: string, filesize: number): void {
    if (!this.canUploadCnab) {
      alert('Seu cargo não possui permissão para importar arquivos CNAB/OFX.');
      return;
    }
    if (filesize > 50 * 1024 * 1024) {
      alert('Tamanho limite de arquivo excedido (max 50MB)');
      return;
    }
    const ext = filename.split('.').pop()?.toLowerCase();
    if (!['ofx', 'cnab', 'ret', 'txt'].includes(ext || '')) {
      alert('Formato incompatível. Formatos desejados: .ofx, .cnab, .ret, .txt');
      return;
    }
    this.isUploading = true;
    this.uploadProgress = 10;
    this.parsedLinesLogs = [`Iniciando leitura do arquivo ${filename}`, 'Validando cabeçalhos de remessa...'];
    setTimeout(() => {
      this.uploadProgress = 40;
      this.parsedLinesLogs = [...this.parsedLinesLogs, 'Encontrado HEADER do banco emissor', 'Analisando lote 1: 14 transações detectadas'];
    }, 600);
    setTimeout(() => {
      this.uploadProgress = 75;
      this.parsedLinesLogs = [...this.parsedLinesLogs, 'Processando transações lineares...', 'Mapeando registros de pagamento - Detalhe Segmento A'];
    }, 1200);
    setTimeout(() => {
      this.uploadProgress = 100;
      this.parsedLinesLogs = [...this.parsedLinesLogs, 'Conciliação automática gerada. 4 novos pares correlacionados!', 'Retorno processado com sucesso.'];
      this.addTransaction({ id: `new-parsed-${Date.now()}`, description: 'VANCE GESTÃO PROCESSAMENTO RETORNO', bank: 'Itaú Unibanco S.A.', bankCode: '341', direction: 'inflow', status: 'pending', value: 12500, date: '2026-06-21', reference: 'NF-E RETORNO AUTOMATICO', category: 'Contratos Clientes', score: 0.94, externalId: 'EXT-9988' });
      this.addTransaction({ id: `new-parsed-${Date.now() + 1}`, description: 'PAGAMENTO FORNECEDOR SILVA SERVIÇOS', bank: 'Banco do Brasil S.A.', bankCode: '001', direction: 'outflow', status: 'pending', value: -3100, date: '2026-06-20', reference: 'DUPLICATA FORN-4512', category: 'Fornecedores', score: 0.76, externalId: 'EXT-9989' });
    }, 2000);
  }

  bulkConfirm(): void {
    if (!this.canReconcile) {
      alert('Seu cargo não possui permissão para aprovar conciliações.');
      return;
    }
    this.selectedTxIds.forEach((id) => this.updateTransactionStatus(id, 'matched'));
    this.selectedTxIds = [];
  }

  resolveAlert(id: string): void {
    this.alerts = this.alerts.map((alert) => alert.id === id ? { ...alert, status: 'resolved' } : alert);
  }

  snoozeAlert(id: string, durationHours: number): void {
    const date = new Date();
    date.setHours(date.getHours() + durationHours);
    const formatted = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    this.alerts = this.alerts.map((alert) => alert.id === id ? { ...alert, status: 'snoozed', snoozedUntil: `${formatted} (Hoje)` } : alert);
  }

  filteredAlertList(): Alert[] {
    return this.filteredAlerts.filter((alert) => {
      if (this.alertLevelFilter !== 'all' && alert.level !== this.alertLevelFilter) return false;
      if (this.alertCategoryFilter !== 'all' && alert.category !== this.alertCategoryFilter) return false;
      return true;
    });
  }

  levelClass(level: Alert['level']): string {
    if (level === 'critical') return 'bg-red-500/10 border-red-500/30 text-red-500';
    if (level === 'high') return 'bg-orange-500/10 border-orange-500/30 text-orange-500';
    if (level === 'medium') return 'bg-amber-500/10 border-amber-500/30 text-amber-500';
    return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
  }

  handleSaveCompany(): void {
    if (!this.canManageSettings) {
      alert('Erro: Seu cargo não possui permissão para alterar as configurações do inquilino.');
      return;
    }
    this.appState = {
      ...this.appState,
      selectedCompany: {
        ...this.appState.selectedCompany,
        nomeFantasia: this.compName,
        cnpj: this.compCnpj,
        regime: this.compRegime,
        minBalanceAlert: Number(this.compLimit),
        timezone: this.compTimezone,
        certificateUploaded: this.isCertUploaded,
      },
    };
    this.triggerSaveSuccess();
  }

  handleCertSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.uploadingCert = true;
    setTimeout(() => {
      this.uploadingCert = false;
      this.isCertUploaded = true;
      this.appState = {
        ...this.appState,
        selectedCompany: { ...this.appState.selectedCompany, certificateUploaded: true, certificateExpiry: '2027-06-21' },
      };
      input.value = '';
      this.triggerSaveSuccess();
    }, 1300);
  }

  sendInvite(): void {
    if (!this.canManageUsers) {
      alert('Erro: Apenas Administradores podem convidar novos usuários.');
      return;
    }
    if (!this.inviteEmail || !this.inviteName) return;
    const user: User = {
      id: `usr-${Date.now()}`,
      name: this.inviteName,
      email: this.inviteEmail,
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100',
      role: this.inviteRole,
      status: 'pending',
      lastActive: 'Pendente',
      lastIp: '—',
      device: 'E-mail enviado',
    };
    this.users = [...this.users, user];
    this.inviteEmail = '';
    this.inviteName = '';
    this.showInviteModal = false;
    this.triggerSaveSuccess();
  }

  updateUserRole(id: string, role: UserRole): void {
    if (!this.canManageUsers) return;
    this.users = this.users.map((user) => user.id === id ? { ...user, role } : user);
  }

  toggleUserStatus(id: string): void {
    if (!this.canManageUsers) return;
    this.users = this.users.map((user) => user.id === id ? { ...user, status: user.status === 'active' ? 'inactive' : 'active' } : user);
  }

  handleTestBankApi(): void {
    if (this.testingBankApi) return;
    this.testingBankApi = true;
    this.bankApiLogs = [{ time: this.getNowTime(), type: 'info', message: `Iniciando handshake síncrono com API do ${this.getBankFullName(this.selectedBankApi)} PJ...` }];
    setTimeout(() => {
      this.bankApiLogs = [...this.bankApiLogs, { time: this.getNowTime(), type: 'info', message: 'Resolvendo endpoint OAuth do gateway de homologação...' }, { time: this.getNowTime(), type: 'info', message: `Enviando Credenciais do Cliente: ${this.clientId ? 'PROVEC_CLIENT_ID' : 'Default Sandbox Token'}` }];
    }, 600);
    setTimeout(() => {
      if (!this.clientId && this.selectedBankApi !== 'nubank') {
        this.bankApiLogs = [...this.bankApiLogs, { time: this.getNowTime(), type: 'warning', message: 'Nenhuma chave Client ID informada. Utilizando credencial provisória de testes (Sandbox).' }];
      }
      this.bankApiLogs = [...this.bankApiLogs, { time: this.getNowTime(), type: 'info', message: 'Processando certificado digital A1 ICP-Brasil...' }, { time: this.getNowTime(), type: 'success', message: 'Autenticação MTLS efetuada com sucesso.' }];
    }, 1200);
    setTimeout(() => {
      const bankName = this.getBankFullName(this.selectedBankApi);
      this.bankApiLogs = [...this.bankApiLogs, { time: this.getNowTime(), type: 'success', message: 'Conexão API estabelecida de forma síncrona!' }, { time: this.getNowTime(), type: 'info', message: `Webhook pronto em: https://vance.com.br/api/v1/webhooks/${this.selectedBankApi}` }];
      this.testingBankApi = false;
      if (!this.pluggyAccounts.some((account) => account.bankName === bankName)) {
        this.pluggyAccounts = [...this.pluggyAccounts, { id: `acc-${Date.now()}`, name: 'Conta Corrente Integrada', type: 'checking', bankName, balance: 75000, syncStatus: 'success', lastSync: 'Agora mesmo', companyCnpj: this.companies[0]?.cnpj || '12345678000199' }];
      }
    }, 2000);
  }

  addAccount(): void {
    if (!this.newAccName || !this.newAccBalance) return;
    this.pluggyAccounts = [
      ...this.pluggyAccounts,
      {
        id: `acc-${Date.now()}`,
        name: this.newAccType === 'cash' ? this.newAccName : `${this.newAccName} (${this.newAccAgency}-${this.newAccNumber})`,
        type: this.newAccType,
        bankName: this.newAccType === 'cash' ? 'Caixa em Dinheiro' : this.newAccBankName,
        balance: parseFloat(this.newAccBalance) || 0,
        syncStatus: 'success',
        lastSync: 'Sincronizado agora',
        companyCnpj: this.newAccCompanyCnpj || this.companies[0]?.cnpj || '12345678000199',
      },
    ];
    this.newAccName = '';
    this.newAccBalance = '';
    this.newAccAgency = '';
    this.newAccNumber = '';
    this.showAddAccountForm = false;
  }

  removeAccount(id: string): void {
    this.pluggyAccounts = this.pluggyAccounts.filter((account) => account.id !== id);
  }

  handleTestErp(): void {
    if (this.testingErp) return;
    this.testingErp = true;
    this.erpLogs = [{ time: this.getNowTime(), type: 'info', message: `Estabelecendo sincronia de dados com ${this.getErpFullName(this.selectedErp)}...` }];
    setTimeout(() => {
      this.erpLogs = [...this.erpLogs, { time: this.getNowTime(), type: 'info', message: `Acessando endpoint REST: ${this.erpUrl}` }, { time: this.getNowTime(), type: 'info', message: `Validando API Token: ${this.erpToken ? '••••••••' : 'Em branco'}` }];
    }, 500);
    setTimeout(() => {
      if (!this.erpToken && this.selectedErp !== 'custom') {
        this.erpLogs = [...this.erpLogs, { time: this.getNowTime(), type: 'error', message: 'Falha na autenticação: API Token é obrigatório para produção.' }];
        this.erpStatus = 'error';
        this.testingErp = false;
      } else {
        this.erpLogs = [...this.erpLogs, { time: this.getNowTime(), type: 'info', message: 'Conectado! Mapeando entidades AP e AR...' }, { time: this.getNowTime(), type: 'success', message: 'Campos customizados mapeados com sucesso!' }];
        setTimeout(() => {
          this.erpLogs = [...this.erpLogs, { time: this.getNowTime(), type: 'success', message: 'Sincronização de ERP estabelecida com status operacional ativo!' }];
          this.erpStatus = 'connected';
          this.testingErp = false;
        }, 800);
      }
    }, 1400);
  }

  addCompany(): void {
    if (!this.newCnpj || !this.newNomeFantasia || !this.newRazaoSocial) return;
    const cleanCnpj = this.newCnpj.replace(/\D/g, '');
    this.companies = [
      ...this.companies,
      {
        cnpj: cleanCnpj || this.newCnpj,
        razaoSocial: this.newRazaoSocial,
        nomeFantasia: this.newNomeFantasia.toUpperCase(),
        regime: this.newRegime,
        minBalanceAlert: parseFloat(this.newMinBalance) || 10000,
        timezone: 'America/Sao_Paulo',
        certificateUploaded: false,
      },
    ];
    this.newCnpj = '';
    this.newRazaoSocial = '';
    this.newNomeFantasia = '';
    this.newRegime = 'Simples Nacional';
    this.showAddCompanyForm = false;
  }

  removeCompany(cnpj: string): void {
    this.companies = this.companies.filter((company) => company.cnpj !== cnpj);
    if (this.selectedCompanyCnpj === cnpj) this.selectedCompanyCnpj = 'consolidado';
  }

  toggleMfa(): void {
    if (this.mfaEnabled) {
      this.mfaEnabled = false;
      this.totpInput = '';
    } else if (this.totpInput === '123456') {
      this.mfaEnabled = true;
    } else {
      alert('Código de verificação TOTP inválido no simulador. Código padrão de teste: 123456');
    }
  }

  terminateSession(id: string): void {
    this.activeSessions = this.activeSessions.filter((session) => session.id !== id);
  }

  handleExportDataRequest(): void {
    this.lgpdRequestSuccess = true;
    this.lgpdTimer = 3;
    const interval = setInterval(() => {
      this.lgpdTimer -= 1;
      if (this.lgpdTimer <= 0) clearInterval(interval);
    }, 1000);
  }

  toggleNotifRule(key: keyof typeof this.notifRules): void {
    this.notifRules[key] = !this.notifRules[key];
  }

  getNowTime(): string {
    return new Date().toLocaleTimeString('pt-BR');
  }

  getBankFullName(code: string): string {
    const names: Record<string, string> = {
      itau: 'Itaú Unibanco S.A.',
      bradesco: 'Bradesco Net Empresa',
      bb: 'Banco do Brasil S.A.',
      santander: 'Santander PJ',
      nubank: 'Nubank Co-Corporativo PJ',
    };
    return names[code] || 'Banco de Destino PJ';
  }

  getErpFullName(code: string): string {
    const names: Record<string, string> = {
      omie: 'Omie ERP',
      totvs: 'Totvs Protheus / RM Pro',
      contaazul: 'Conta Azul',
      bling: 'Bling ERP',
      custom: 'REST API Customizada',
    };
    return names[code] || 'Sistema ERP';
  }

  triggerFeedback(message: string): void {
    this.feedbackMessage = message;
    setTimeout(() => this.feedbackMessage = null, 4000);
  }

  triggerSaveSuccess(): void {
    this.saveSuccess = true;
    setTimeout(() => this.saveSuccess = false, 2000);
  }

  categoryPercentage(category: ChartCategory[], item: ChartCategory): number {
    const total = category.reduce((sum, current) => sum + current.value, 0) || 1;
    return (item.value / total) * 100;
  }

  cashflowHeight(value: number): number {
    const max = Math.max(...this.cashflowData.map((point) => Math.max(point.inflow, point.outflow)), 50000);
    return Math.max(8, (value / max) * 130);
  }

  projectionY(value: number): number {
    const values = this.projectionData.flatMap((point) => [point.projected, point.lowerBound, point.upperBound]);
    const min = Math.min(...values) - 5000;
    const max = Math.max(...values) + 5000;
    return 180 - ((value - min) / (max - min)) * 130;
  }

  projectionPath(): string {
    return this.projectionData.map((point, index) => `${index === 0 ? 'M' : 'L'} ${40 + index * 85} ${this.projectionY(point.projected)}`).join(' ');
  }
}
