export type TransactionStatus = 'pending' | 'matched' | 'manual' | 'closed' | 'disputed';
export type TransactionDirection = 'inflow' | 'outflow';

export interface Transaction {
  id: string;
  description: string;
  bank: string;
  bankCode: string;
  direction: TransactionDirection;
  status: TransactionStatus;
  value: number;
  date: string;
  reference: string;
  category: string;
  score?: number; // confidence score for auto/suggested matching
  externalId?: string;
  matchedId?: string;
}

export type UserRole = 'viewer' | 'analista' | 'tesouraria' | 'gerencia' | 'diretor' | 'admin';
export type UserStatus = 'active' | 'inactive' | 'pending';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  status: UserStatus;
  lastActive: string;
  lastIp: string;
  device: string;
}

export type AlertLevel = 'critical' | 'high' | 'medium' | 'info';
export type AlertStatus = 'active' | 'snoozed' | 'resolved';

export interface Alert {
  id: string;
  title: string;
  description: string;
  level: AlertLevel;
  status: AlertStatus;
  category: string;
  date: string;
  actionUrl?: string;
  snoozedUntil?: string;
}

export interface PluggyAccount {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit_card';
  bankName: string;
  balance: number;
  syncStatus: 'success' | 'failed' | 'syncing';
  lastSync: string;
}

export interface WebhookLog {
  id: string;
  url: string;
  event: string;
  status: 'success' | 'failed';
  timestamp: string;
  duration: number; // in ms
  statusCode: number;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
  ip: string;
}

export interface AppState {
  theme: 'dark' | 'light';
  sidebarOpen: boolean;
  density: 'compact' | 'standard' | 'comfortable';
  selectedCompany: {
    cnpj: string;
    razaoSocial: string;
    nomeFantasia: string;
    regime: string;
    logo?: string;
    minBalanceAlert: number;
    timezone: string;
    certificateUploaded: boolean;
    certificateExpiry?: string;
  };
}
