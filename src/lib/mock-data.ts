// ============================================================================
// MOCK DATA — PONTO ÚNICO DE SUBSTITUIÇÃO (Fase 2)
// ----------------------------------------------------------------------------
// Este módulo concentra todos os dados mock extraídos do protótipo original
// (src/App.tsx do projeto Vite). Na Fase 2 da migração, cada função/array
// aqui será substituído por uma chamada real ao Supabase
// (ex: getTransactions() -> supabase.from('transactions').select()).
//
// Mantendo tudo em um único arquivo, a troca por dados reais não exige
// caçar referências espalhadas pelos componentes — só trocar o import.
// ============================================================================

import {
  Transaction,
  Alert,
  User,
  PluggyAccount,
  WebhookLog,
  AuditLog,
} from './types';

export const initialTransactions: Transaction[] = [
  {
    id: 'tx-1',
    description: 'PIX RECEBIDO CONTRATO MENSAL SUITE',
    bank: 'XP Investimentos',
    bankCode: '102',
    direction: 'inflow',
    status: 'matched',
    value: 18200.0,
    date: '2026-06-21',
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
    date: '2026-06-20',
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
    date: '2026-06-21',
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
    date: '2026-06-19',
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
    date: '2026-06-18',
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
    date: '2026-06-17',
    reference: 'CDI XP INVESTIMENTOS CDB LIQUIDO',
    category: 'Juros e Rendimentos',
    score: 0.95,
  },
];

export const initialAlerts: Alert[] = [
  {
    id: 'al-1',
    title: 'Saldo Itaú abaixo do limite de segurança',
    description:
      'O saldo sincronizado via Pluggy (R$ 4.200,00) está inferior à margem parametrizada de R$ 10.000,00.',
    level: 'critical',
    status: 'active',
    category: 'Open Finance',
    date: '2026-06-21',
  },
  {
    id: 'al-2',
    title: 'Duplicata Fornecedor vencendo hoje',
    description:
      'Título financeiro Silveira Express (R$ 3.100,00) registra vencimento em 21/06 sem conciliação correspondente no extrato bancário.',
    level: 'high',
    status: 'active',
    category: 'Faturamento',
    date: '2026-06-21',
  },
  {
    id: 'al-3',
    title: 'Conexão Open Finance Pluggy atualizada',
    description:
      'Contas bancárias sincronizadas perfeitamente com os bancos locais à 1 hora atrás.',
    level: 'info',
    status: 'active',
    category: 'Open Finance',
    date: '2026-06-21',
  },
];

export const initialUsers: User[] = [
  {
    id: 'u-1',
    name: 'Diego Terrani',
    email: 'diego.terrani@gmail.com',
    avatar:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100',
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
    avatar:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100',
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
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100',
    role: 'analista',
    status: 'active',
    lastActive: '3 dias atrás',
    lastIp: '191.134.12.82',
    device: 'Linux Mint Firefox 112',
  },
];

export const initialPluggyAccounts: PluggyAccount[] = [
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
    lastSync: '06:00 Hoje',
  },
];

export const initialWebhookLogs: WebhookLog[] = [
  {
    id: 'wh-1',
    url: 'https://meu-sistema-erp.com/webhooks/vance',
    event: 'cnab.processed',
    status: 'success',
    timestamp: '21/06 14:10',
    duration: 154,
    statusCode: 200,
  },
  {
    id: 'wh-2',
    url: 'https://meu-sistema-erp.com/webhooks/vance',
    event: 'balance.alert',
    status: 'success',
    timestamp: '21/06 13:00',
    duration: 89,
    statusCode: 200,
  },
  {
    id: 'wh-3',
    url: 'https://meu-sistema-erp.com/webhooks/vance',
    event: 'cnab.processed',
    status: 'failed',
    timestamp: '20/06 09:12',
    duration: 320,
    statusCode: 502,
  },
];

export const initialAuditLogs: AuditLog[] = [
  {
    id: 'aud-1',
    userId: 'u-1',
    userName: 'Diego Terrani',
    action: 'CONCILIAÇÃO_AUTO',
    details: 'Aprovação massiva de 4 lançamentos via CNAB retornado',
    timestamp: '2026-06-21T14:10:00Z',
    ip: '177.34.21.198',
  },
  {
    id: 'aud-2',
    userId: 'u-1',
    userName: 'Diego Terrani',
    action: 'ATUALIZAR_CERTIFICADO',
    details: 'Arquivo de faturamento certificado A1 enviado (.pfx)',
    timestamp: '2026-06-21T12:00:00Z',
    ip: '177.34.21.198',
  },
  {
    id: 'aud-3',
    userId: 'u-2',
    userName: 'Mariana Santos',
    action: 'OPEN_FINANCE_SYNC',
    details: 'Forçado sincronismo manual nas agências de XP Corp',
    timestamp: '2026-06-20T18:30:00Z',
    ip: '189.44.12.22',
  },
];

export const mockCashflowData = [
  { month: 'Jan', inflow: 34000, outflow: 21000, balance: 13000 },
  { month: 'Fev', inflow: 42000, outflow: 28000, balance: 14000 },
  { month: 'Mar', inflow: 38000, outflow: 32000, balance: 6000 },
  { month: 'Abr', inflow: 51000, outflow: 25000, balance: 26000 },
  { month: 'Mai', inflow: 48000, outflow: 29000, balance: 19000 },
  { month: 'Jun', inflow: 52000, outflow: 31000, balance: 21000 },
];
