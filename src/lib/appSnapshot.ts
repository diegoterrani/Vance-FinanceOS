import { Alert, AppState, AuditLog, PluggyAccount, Transaction, User, WebhookLog } from '../types';

const STORAGE_KEY = 'vance-financeos.snapshot';
const REMOTE_BOOTSTRAP_PATH = import.meta.env.VITE_BOOTSTRAP_API_PATH || '/api/bootstrap';

const isoDateDaysAgo = (daysAgo: number) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
};

const isoTimestampHoursAgo = (hoursAgo: number) => {
  const date = new Date();
  date.setHours(date.getHours() - hoursAgo);
  return date.toISOString();
};

export interface AppSnapshot {
  appState: AppState;
  transactions: Transaction[];
  alerts: Alert[];
  users: User[];
  pluggyAccounts: PluggyAccount[];
  webhookLogs: WebhookLog[];
  auditLogs: AuditLog[];
}

export const DEFAULT_APP_SNAPSHOT: AppSnapshot = {
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
  transactions: [
    {
      id: 'tx-1',
      description: 'PIX RECEBIDO CONTRATO MENSAL SUITE',
      bank: 'XP Investimentos',
      bankCode: '102',
      direction: 'inflow',
      status: 'matched',
      value: 18200.0,
      date: isoDateDaysAgo(0),
      reference: 'PIX EM ENTRADA RECORRENTE',
      category: 'Contratos Clientes',
      score: 0.98,
    },
    {
      id: 'tx-2',
      description: 'PAGAMENTO FORNECEDOR NUVEM HOSTING',
      bank: 'Itaú Unibanco S.A.',
      bankCode: '341',
      direction: 'outflow',
      status: 'matched',
      value: -4400.0,
      date: isoDateDaysAgo(1),
      reference: 'AWS HOSTING CLOUD RUN DEBITO',
      category: 'Sistemas e Softwares',
      score: 0.91,
    },
    {
      id: 'tx-3',
      description: 'TRANSFERENCIA TED ENTRADA ADIANTAMENTO',
      bank: 'Itaú Unibanco S.A.',
      bankCode: '341',
      direction: 'inflow',
      status: 'pending',
      value: 12500.0,
      date: isoDateDaysAgo(0),
      reference: 'TED STRIPE PAYMENTS INBOUND',
      category: 'Contratos Clientes',
      score: 0.78,
    },
    {
      id: 'tx-4',
      description: 'IMPOSTO GUIA DAS RECOLHIMENTO MENSAL',
      bank: 'Banco do Brasil S.A.',
      bankCode: '001',
      direction: 'outflow',
      status: 'matched',
      value: -10300.0,
      date: isoDateDaysAgo(2),
      reference: 'PAGAMENTO GUIA SIMPLES DAS SFN',
      category: 'Impostos e Contribuições',
      score: 0.99,
    },
    {
      id: 'tx-5',
      description: 'RETIRADA PRO LABORE SOCIO INTERNO',
      bank: 'Itaú Unibanco S.A.',
      bankCode: '341',
      direction: 'outflow',
      status: 'pending',
      value: -8500.0,
      date: isoDateDaysAgo(3),
      reference: 'REMUNERACAO PROLABORE MENSAL',
      category: 'Folha de Pagamento',
      score: 0.65,
    },
    {
      id: 'tx-6',
      description: 'RENDIMENTOS APLICAÇÃO CDI DIÁRIA',
      bank: 'XP Investimentos',
      bankCode: '102',
      direction: 'inflow',
      status: 'matched',
      value: 1840.0,
      date: isoDateDaysAgo(4),
      reference: 'CDI XP INVESTIMENTOS CDB LIQUIDO',
      category: 'Juros e Rendimentos',
      score: 0.95,
    },
  ],
  alerts: [
    {
      id: 'al-1',
      title: 'Saldo Itaú abaixo do limite de segurança',
      description: 'O saldo sincronizado via Pluggy (R$ 4.200,00) está inferior à margem parametrizada de R$ 10.000,00.',
      level: 'critical',
      status: 'active',
      category: 'Open Finance',
      date: isoDateDaysAgo(0),
    },
    {
      id: 'al-2',
      title: 'Duplicata Fornecedor vencendo hoje',
      description: 'Título financeiro Silveira Express (R$ 3.100,00) registra vencimento em 21/06 sem conciliação correspondente no extrato bancário.',
      level: 'high',
      status: 'active',
      category: 'Faturamento',
      date: isoDateDaysAgo(0),
    },
    {
      id: 'al-3',
      title: 'Conexão Open Finance Pluggy atualizada',
      description: 'Contas bancárias sincronizadas perfeitamente com os bancos locais à 1 hora atrás.',
      level: 'info',
      status: 'active',
      category: 'Open Finance',
      date: isoDateDaysAgo(0),
    },
  ],
  users: [
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
  ],
  pluggyAccounts: [
    {
      id: 'acc-itau',
      name: 'Itaú Unibanco S.A.',
      type: 'checking',
      bankName: 'Itaú Corp',
      balance: 4200.0,
      syncStatus: 'success',
      lastSync: '06:00 Hoje',
    },
    {
      id: 'acc-xp',
      name: 'XP Investimentos',
      type: 'savings',
      bankName: 'XP Corporate',
      balance: 44120.0,
      syncStatus: 'success',
      lastSync: '06:00 Hoje font-mono',
    },
  ],
  webhookLogs: [
    { id: 'wh-1', url: 'https://meu-sistema-erp.com/webhooks/vance', event: 'cnab.processed', status: 'success', timestamp: '21/06 14:10', duration: 154, statusCode: 200 },
    { id: 'wh-2', url: 'https://meu-sistema-erp.com/webhooks/vance', event: 'balance.alert', status: 'success', timestamp: '21/06 13:00', duration: 89, statusCode: 200 },
    { id: 'wh-3', url: 'https://meu-sistema-erp.com/webhooks/vance', event: 'cnab.processed', status: 'failed', timestamp: '20/06 09:12', duration: 320, statusCode: 502 },
  ],
  auditLogs: [
    { id: 'aud-1', userId: 'u-1', userName: 'Diego Terrani', action: 'CONCILIAÇÃO_AUTO', details: 'Aprovação massiva de 4 lançamentos via CNAB retornado', timestamp: isoTimestampHoursAgo(8), ip: '177.34.21.198' },
    { id: 'aud-2', userId: 'u-1', userName: 'Diego Terrani', action: 'ATUALIZAR_CERTIFICADO', details: 'Arquivo de faturamento certificado A1 enviado (.pfx)', timestamp: isoTimestampHoursAgo(10), ip: '177.34.21.198' },
    { id: 'aud-3', userId: 'u-2', userName: 'Mariana Santos', action: 'OPEN_FINANCE_SYNC', details: 'Forçado sincronismo manual nas agências de XP Corp', timestamp: isoTimestampHoursAgo(28), ip: '189.44.12.22' },
  ],
};

interface RemoteBootstrapResponse {
  snapshot?: AppSnapshot;
}

export async function loadAppSnapshot(): Promise<AppSnapshot> {
  const localSnapshot = readLocalSnapshot();
  if (localSnapshot) {
    return localSnapshot;
  }

  const remoteSnapshot = await readRemoteSnapshot();
  if (remoteSnapshot) {
    persistAppSnapshot(remoteSnapshot);
    return remoteSnapshot;
  }

  return DEFAULT_APP_SNAPSHOT;
}

export function persistAppSnapshot(snapshot: AppSnapshot) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
}

function readLocalSnapshot(): AppSnapshot | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const value = window.localStorage.getItem(STORAGE_KEY);
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value);
    return isAppSnapshot(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

async function readRemoteSnapshot(): Promise<AppSnapshot | null> {
  try {
    const response = await fetch(REMOTE_BOOTSTRAP_PATH, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (response.status === 204 || !response.ok) {
      return null;
    }

    const payload = (await response.json()) as RemoteBootstrapResponse;
    return payload.snapshot && isAppSnapshot(payload.snapshot) ? payload.snapshot : null;
  } catch {
    return null;
  }
}

function isAppSnapshot(value: unknown): value is AppSnapshot {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const snapshot = value as Record<string, unknown>;
  return (
    isArray(snapshot.transactions) &&
    isArray(snapshot.alerts) &&
    isArray(snapshot.users) &&
    isArray(snapshot.pluggyAccounts) &&
    isArray(snapshot.webhookLogs) &&
    isArray(snapshot.auditLogs) &&
    !!snapshot.appState &&
    typeof snapshot.appState === 'object'
  );
}

function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}
