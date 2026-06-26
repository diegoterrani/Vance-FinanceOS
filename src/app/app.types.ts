import { TransactionDirection } from '../types';

export interface RegistryItem {
  id: string;
  description: string;
  direction: TransactionDirection;
  value: number;
  dueDate: string;
  bank: string;
  category: string;
  recurrence: 'single' | 'monthly' | 'yearly';
  status: 'pending' | 'realized';
  documentNumber?: string;
}

export interface CashflowPoint {
  month: string;
  inflow: number;
  outflow: number;
  balance: number;
}

export interface ProjectionPoint {
  day: string;
  projected: number;
  lowerBound: number;
  upperBound: number;
}

export interface ChartCategory {
  name: string;
  value: number;
  color: string;
}

export interface TestLog {
  time: string;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
}
