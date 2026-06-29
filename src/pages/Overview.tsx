import React from 'react';
import { Transaction, Alert } from '../types';
import CurrencyDisplay from '../components/finance/CurrencyDisplay';
import { CashflowChart, CategoryBreakdownChart } from '../components/finance/Charts';
import { formatCurrency, formatDate } from '../lib/formatters';
import { ArrowUpRight, ArrowDownRight, RefreshCw, AlertTriangle, FileSpreadsheet, CheckCircle, HelpCircle, ArrowRight } from 'lucide-react';

interface OverviewProps {
  transactions: Transaction[];
  alerts: Alert[];
  accounts?: any[];
  onNavigate: (view: string) => void;
  onResolveAlert: (id: string) => void;
  mockCashflowData: any[];
}

const PALETTE = ['#0F7B6C', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'];

export default function Overview({
  transactions,
  alerts,
  accounts = [],
  onNavigate,
  onResolveAlert,
  mockCashflowData
}: OverviewProps) {
  // Key stats computed from real data
  const totalBalance = accounts.reduce((s, a) => s + (Number(a.balance) || 0), 0);
  const inflowTotal = transactions
    .filter(t => t.direction === 'inflow')
    .reduce((s, t) => s + Math.abs(Number(t.value) || 0), 0);
  const outflowTotal = -transactions
    .filter(t => t.direction === 'outflow')
    .reduce((s, t) => s + Math.abs(Number(t.value) || 0), 0);
  const pendingCount = transactions.filter(t => t.status === 'pending').length;

  const activeUnreadAlerts = alerts.filter(a => a.status === 'active');

  const recentTransactions = transactions.slice(0, 5);

  // Income breakdown by category (inflows), computed from real data
  const catMap = new Map<string, number>();
  for (const t of transactions.filter(t => t.direction === 'inflow')) {
    const k = t.category || 'Outros';
    catMap.set(k, (catMap.get(k) || 0) + Math.abs(Number(t.value) || 0));
  }
  const categoryData = Array.from(catMap.entries()).map(([name, value], i) => ({
    name,
    value,
    color: PALETTE[i % PALETTE.length]
  }));
  const categoryTotal = categoryData.reduce((s, c) => s + c.value, 0);

  return (
    <div className="space-y-6">

      {/* Onboarding (empty state) — drive to the killer workflow */}
      {transactions.length === 0 && (
        <div className="bg-gradient-to-br from-teal-500/10 to-[var(--bg-card)] border border-teal-500/20 rounded-xl p-5">
          <h2 className="text-base font-bold text-[var(--text-primary)]">Comece em 1 minuto: importe seu primeiro boleto ou nota fiscal</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-xl">
            A IA do Vance lê o documento, cria o lançamento e prepara a conciliação — sem digitar. Depois é só conciliar o extrato e ver seu fluxo de caixa.
          </p>
          <button
            onClick={() => onNavigate('registers')}
            className="mt-3 inline-flex items-center gap-1.5 bg-[var(--text-primary)] text-[var(--bg-app)] font-semibold text-xs px-4 py-2 rounded-lg hover:opacity-90 transition-all"
          >
            Importar documento <ArrowRight size={13} />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex justify-between items-center bg-[var(--bg-card)] p-4 rounded-xl border border-[var(--border-soft)]">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Painel de Controle Financeiro</h1>
          <p className="text-xs text-[var(--text-secondary)]">Dados operacionais consolidados via integrações de API REST (PJ)</p>
        </div>
        <div className="flex gap-2 text-xs">
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
          >
            <RefreshCw size={13} className="animate-spin-slow" /> Sincronizar
          </button>
        </div>
      </div>

      {/* 4 KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI: Saldo geral */}
        <div className="p-4 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] transition-all flex flex-col justify-between min-h-[110px]">
          <div className="flex justify-between items-start text-[var(--text-secondary)] text-xs">
            <span>Saldo Consolidado</span>
            <span className="text-green-500 font-mono text-[10px] flex items-center bg-green-500/10 px-1 py-0.25 rounded">
              ▲ +8.3%
            </span>
          </div>
          <div className="my-2">
            <CurrencyDisplay value={totalBalance} variant="large" />
          </div>
          <div className="text-[10px] text-[var(--text-muted)] flex items-center justify-between">
            <span>Última reconciliação: Hoje</span>
            <span className="text-teal-500">Itaú + BB</span>
          </div>
        </div>

        {/* KPI: Entradas */}
        <div className="p-4 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] transition-all flex flex-col justify-between min-h-[110px]">
          <div className="flex justify-between items-start text-[var(--text-secondary)] text-xs">
            <span>Entradas (Mês)</span>
            <ArrowUpRight size={15} className="text-green-500" />
          </div>
          <div className="my-2">
            <CurrencyDisplay value={inflowTotal} variant="large" colorize />
          </div>
          <div className="text-[10px] text-[var(--text-muted)]">
            Faturamento recorrente em dia
          </div>
        </div>

        {/* KPI: Saídas */}
        <div className="p-4 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] transition-all flex flex-col justify-between min-h-[110px]">
          <div className="flex justify-between items-start text-[var(--text-secondary)] text-xs">
            <span>Saídas (Mês)</span>
            <ArrowDownRight size={15} className="text-red-500" />
          </div>
          <div className="my-2">
            <CurrencyDisplay value={outflowTotal} variant="large" colorize />
          </div>
          <div className="text-[10px] text-[var(--text-muted)]">
            Dentro da projeção orçamentária
          </div>
        </div>

        {/* KPI: Conciliação Pendente */}
        <div
          onClick={() => onNavigate('reconciliation')}
          className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 transition-all flex flex-col justify-between min-h-[110px] cursor-pointer group"
        >
          <div className="flex justify-between items-start text-amber-500 text-xs">
            <span>Conciliação Pendente</span>
            <FileSpreadsheet size={15} className="group-hover:translate-x-1 transition-transform" />
          </div>
          <div className="my-1.5 flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold text-[var(--text-primary)]">{pendingCount}</span>
            <span className="text-xs text-[var(--text-secondary)]">transações</span>
          </div>
          <div className="text-[10px] text-amber-600 font-medium flex items-center justify-between">
            <span>Requer ação imediata</span>
            <span className="underline group-hover:text-amber-500">Resolver &rarr;</span>
          </div>
        </div>

      </div>

      {/* Main Row: Cashflow Graph + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Cashflow Line/Bar */}
        <div className="lg:col-span-2">
          <CashflowChart data={mockCashflowData} />
        </div>

        {/* Right 1 Col: Active Warnings */}
        <div className="p-4 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] flex flex-col justify-between min-h-[300px]">
          <div className="border-b border-[var(--border-soft)] pb-3 mb-4 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">
              Alertas Ativos ({activeUnreadAlerts.length})
            </h3>
            <button onClick={() => onNavigate('alerts')} className="text-xs text-teal-500 hover:underline">
              Gerenciar
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto max-h-[220px] pr-2">
            {activeUnreadAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-6 text-[var(--text-muted)]">
                <CheckCircle size={32} className="text-green-500 mb-2 opacity-80" />
                <p className="text-xs font-semibold">Tudo sob controle!</p>
                <p className="text-[10px]">Nenhum alerta financeiro pendente.</p>
              </div>
            ) : (
              activeUnreadAlerts.map(alert => (
                <div
                  key={alert.id}
                  className={`p-2.5 rounded-lg border text-xs flex gap-2 ${
                    alert.level === 'critical' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                    alert.level === 'high' ? 'bg-orange-500/10 border-orange-500/20 text-orange-500' :
                    alert.level === 'medium' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                    'bg-blue-500/10 border-blue-500/20 text-blue-400'
                  }`}
                >
                  <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold leading-tight">{alert.title}</p>
                    <p className="text-[var(--text-secondary)] text-[10px] mt-0.5 leading-tight">{alert.description}</p>
                  </div>
                  <button
                    onClick={() => onResolveAlert(alert.id)}
                    className="self-start text-[9px] hover:underline uppercase font-mono text-[var(--text-muted)] cursor-pointer"
                  >
                    OK
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-[var(--border-soft)] pt-3.5 mt-4">
            <button
              onClick={() => onNavigate('alerts')}
              className="w-full flex items-center justify-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:underline"
            >
              Exibir log detalhado de alertas em tempo real
            </button>
          </div>
        </div>

      </div>

      {/* Row: Recent transactions table + category breakdown donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Recent transactions list */}
        <div className="lg:col-span-2 p-4 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)]">
          <div className="border-b border-[var(--border-soft)] pb-3 mb-4 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                Lançamentos Recentes
              </h3>
              <p className="text-[10px] text-[var(--text-secondary)]">Últimos fluxos detectados no extrato Open Finance</p>
            </div>
            <button
              onClick={() => onNavigate('reconciliation')}
              className="text-xs text-teal-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
            >
              Ver Extrato Completo <ArrowRight size={12} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full dense-table text-left border-collapse">
              <thead>
                <tr>
                  <th>Descrição / Origem</th>
                  <th>Data</th>
                  <th>Banco</th>
                  <th>Status</th>
                  <th className="text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[var(--bg-card-hover)] transition-colors theme-transition">
                    <td>
                      <div className="font-medium text-[var(--text-primary)]">{tx.description}</div>
                      <div className="text-[10px] text-[var(--text-muted)]">{tx.reference}</div>
                    </td>
                    <td className="font-mono text-xs">{formatDate(tx.date)}</td>
                    <td className="text-xs text-[var(--text-secondary)]">{tx.bank}</td>
                    <td>
                      <span className={`inline-flex px-1.5 py-0.5 text-[10px] rounded font-mono font-bold uppercase ${
                        tx.status === 'matched' ? 'bg-green-500/10 text-green-500' :
                        tx.status === 'pending' ? 'bg-amber-500/10 text-amber-500' :
                        tx.status === 'manual' ? 'bg-blue-500/10 text-blue-500' :
                        'bg-red-500/10 text-red-500'
                      }`}>
                        {tx.status === 'matched' ? 'Conciliado' :
                         tx.status === 'pending' ? 'Pendente' :
                         tx.status === 'manual' ? 'Manual' : 'Disputa'}
                      </span>
                    </td>
                    <td className="text-right">
                      <CurrencyDisplay value={tx.value} colorize />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Income category weight */}
        <div>
          <CategoryBreakdownChart
            categories={categoryData}
            total={categoryTotal}
            title="Detalhamento das Fontes de Receita"
          />
        </div>

      </div>

    </div>
  );
}
