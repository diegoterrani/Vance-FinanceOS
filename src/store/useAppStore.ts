import { create } from 'zustand';
import {
  Transaction,
  Alert,
  User,
  PluggyAccount,
  WebhookLog,
  AuditLog,
  AppState,
  TransactionStatus,
  UserRole,
} from '@/lib/types';
import {
  initialTransactions,
  initialAlerts,
  initialUsers,
  initialPluggyAccounts,
  initialWebhookLogs,
  initialAuditLogs,
} from '@/lib/mock-data';

// ============================================================================
// Store global de UI/preferências (Zustand) — substitui o `appState` que
// vivia em useState no App.tsx original do protótipo Vite.
// Ref: documento, seção 1 ("Estado Global | Zustand | Store leve para
// preferências de UI, filtros ativos, tema").
// ============================================================================

interface DomainState {
  transactions: Transaction[];
  alerts: Alert[];
  users: User[];
  pluggyAccounts: PluggyAccount[];
  webhookLogs: WebhookLog[];
  auditLogs: AuditLog[];

  selectedCompany: AppState['selectedCompany'];
  density: AppState['density'];

  addTransaction: (tx: Transaction) => void;
  updateTransactionStatus: (id: string, status: TransactionStatus) => void;
  resolveAlert: (id: string) => void;
  snoozeAlert: (id: string, durationHours: number) => void;
  addUser: (user: User) => void;
  updateUserRole: (id: string, role: UserRole) => void;
  toggleUserStatus: (id: string) => void;
  addPluggyAccount: (acc: PluggyAccount) => void;
  updateSelectedCompany: (patch: Partial<AppState['selectedCompany']>) => void;
}

function pushAudit(auditLogs: AuditLog[], action: string, details: string): AuditLog[] {
  const newAudit: AuditLog = {
    id: `aud-${Date.now()}`,
    userId: 'u-1',
    userName: 'Diego Terrani',
    action,
    details,
    timestamp: new Date().toISOString(),
    ip: '177.34.21.198',
  };
  return [newAudit, ...auditLogs];
}

export const useAppStore = create<DomainState>((set, get) => ({
  transactions: initialTransactions,
  alerts: initialAlerts,
  users: initialUsers,
  pluggyAccounts: initialPluggyAccounts,
  webhookLogs: initialWebhookLogs,
  auditLogs: initialAuditLogs,

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
  density: 'standard',

  addTransaction: (tx) =>
    set((state) => ({
      transactions: [tx, ...state.transactions],
      auditLogs: pushAudit(
        state.auditLogs,
        'NOVA_TRANSAÇÃO_PARSADA',
        `Lançamento manual inserido no livro caixa: ${tx.description}`
      ),
    })),

  updateTransactionStatus: (id, status) => {
    const tx = get().transactions.find((t) => t.id === id);
    set((state) => ({
      transactions: state.transactions.map((t) => (t.id === id ? { ...t, status } : t)),
      auditLogs: pushAudit(
        state.auditLogs,
        'ATUALIZAR_STATUS',
        `Lancamento "${tx?.description}" remarcado para o status ${status}`
      ),
    }));
  },

  resolveAlert: (id) =>
    set((state) => ({
      alerts: state.alerts.map((a) => (a.id === id ? { ...a, status: 'resolved' } : a)),
    })),

  snoozeAlert: (id, durationHours) => {
    const d = new Date();
    d.setHours(d.getHours() + durationHours);
    const formattedTime = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === id ? { ...a, status: 'snoozed', snoozedUntil: `${formattedTime} (Hoje)` } : a
      ),
    }));
  },

  addUser: (user) => set((state) => ({ users: [...state.users, user] })),

  updateUserRole: (id, role) =>
    set((state) => ({
      users: state.users.map((u) => (u.id === id ? { ...u, role } : u)),
    })),

  toggleUserStatus: (id) =>
    set((state) => ({
      users: state.users.map((u) =>
        u.id === id ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u
      ),
    })),

  addPluggyAccount: (acc) => set((state) => ({ pluggyAccounts: [...state.pluggyAccounts, acc] })),

  updateSelectedCompany: (patch) =>
    set((state) => ({ selectedCompany: { ...state.selectedCompany, ...patch } })),
}));
