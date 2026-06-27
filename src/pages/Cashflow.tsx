import React, { useState } from 'react';
import { Transaction } from '../types';
import { CashflowChart, ProjectionChart, CategoryBreakdownChart } from '../components/finance/Charts';
import CurrencyDisplay from '../components/finance/CurrencyDisplay';
import { formatCurrency } from '../lib/formatters';
import { ArrowUpRight, ArrowDownRight, TrendingUp, Calendar, Share2, Printer } from 'lucide-react';

interface CashflowProps {
  mockCashflowData: any[];
  transactions?: Transaction[];
  accounts?: any[];
}

const PALETTE = ['#EF4444', '#312E81', '#F59E0B', '#8B5CF6', '#0F7B6C', '#3B82F6'];

export default function Cashflow({ mockCashflowData, transactions = [], accounts = [] }: CashflowProps) {
  const [period] = useState('6m');

  // Stats computed from real data
  const totalInflows = transactions
    .filter(t => t.direction === 'inflow')
    .reduce((s, t) => s + Math.abs(Number(t.value) || 0), 0);
  const totalOutflows = -transactions
    .filter(t => t.direction === 'outflow')
    .reduce((s, t) => s + Math.abs(Number(t.value) || 0), 0);
  const netBalance = totalInflows + totalOutflows;
  const currentBalance = accounts.reduce((s, a) => s + (Number(a.balance) || 0), 0);

  // Forward projection derived from the monthly balance trend.
  const projectionData = (() => {
    let cumulative = currentBalance;
    const pts = (mockCashflowData || []).map((m: any) => {
      cumulative += Number(m.balance) || 0;
      return {
        day: m.month,
        projected: Math.round(cumulative),
        lowerBound: Math.round(cumulative * 0.92),
        upperBound: Math.round(cumulative * 1.08),
      };
    });
    return pts;
  })();
  const projectedSurplus = projectionData.length
    ? projectionData[projectionData.length - 1].projected - currentBalance
    : netBalance;

  // Expense breakdown by category (outflows), computed from real data.
  const expMap = new Map<string, number>();
  for (const t of transactions.filter(t => t.direction === 'outflow')) {
    const k = t.category || 'Outros';
    expMap.set(k, (expMap.get(k) || 0) + Math.abs(Number(t.value) || 0));
  }
  const expenseCategories = Array.from(expMap.entries()).map(([name, value], i) => ({
    name,
    value,
    color: PALETTE[i % PALETTE.length],
  }));
  const expenseTotal = expenseCategories.reduce((s, c) => s + c.value, 0);

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-black/5 p-4 rounded-xl border border-[var(--border-soft)]">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Painel Gerencial de Margem</h1>
          <p className="text-xs text-[var(--text-secondary)]">Projeções e saldos calculados a partir dos lançamentos reais (período: {period})</p>
        </div>

        <div className="flex gap-2 text-xs">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer">
            <Share2 size={13} /> Exportar PDF
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer">
            <Printer size={13} /> Imprimir
          </button>
        </div>
      </div>

      {/* Stats Indicators Rows */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        <div className="p-4 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)]">
          <p className="text-xs text-[var(--text-secondary)]">Total de Entradas</p>
          <div className="my-1.5 flex items-center justify-between">
            <CurrencyDisplay value={totalInflows} variant="large" />
            <span className="p-1 rounded-full bg-green-500/10 text-green-500">
              <ArrowUpRight size={15} />
            </span>
          </div>
          <p className="text-[10px] text-[var(--text-muted)] font-mono">Consolidado do período</p>
        </div>

        <div className="p-4 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)]">
          <p className="text-xs text-[var(--text-secondary)]">Total de Saídas</p>
          <div className="my-1.5 flex items-center justify-between">
            <CurrencyDisplay value={totalOutflows} variant="large" />
            <span className="p-1 rounded-full bg-red-500/10 text-red-500">
              <ArrowDownRight size={15} />
            </span>
          </div>
          <p className="text-[10px] text-[var(--text-muted)] font-mono">Controle de liquidações</p>
        </div>

        <div className="p-4 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)]">
          <p className="text-xs text-[var(--text-secondary)]">Saldo Líquido Período</p>
          <div className="my-1.5">
            <CurrencyDisplay value={netBalance} variant="large" colorize />
          </div>
          <p className="text-[10px] text-[var(--text-muted)] font-mono">Entradas menos saídas</p>
        </div>

        <div className="p-4 rounded-xl border border-teal-500/20 bg-teal-500/5">
          <p className="text-xs text-teal-400">Saldo Projetado</p>
          <div className="my-1.5 flex items-center justify-between">
            <CurrencyDisplay value={projectedSurplus} variant="large" colorize />
            <TrendingUp size={15} className="text-teal-500" />
          </div>
          <p className="text-[10px] text-[var(--text-muted)] font-mono">Tendência do saldo das contas</p>
        </div>

      </div>

      {/* Main Charts: Current Period cashflow + Projection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <CashflowChart data={mockCashflowData} />
        </div>
        <div>
          <ProjectionChart data={projectionData} />
        </div>
      </div>

      {/* Outflow category splits & monthly summaries */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        <div className="lg:col-span-2">
          <CategoryBreakdownChart
            categories={expenseCategories}
            total={expenseTotal}
            title="Distribuição Analítica de Custos"
          />
        </div>

        <div className="lg:col-span-2 p-4 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Resultado Mensal</h3>
            <p className="text-[10px] text-[var(--text-secondary)]">Entradas líquidas por mês, a partir dos lançamentos reais</p>
          </div>

          <div className="space-y-3">
            {(mockCashflowData || []).length === 0 && (
              <p className="text-xs text-[var(--text-muted)] text-center py-6">Sem lançamentos no período. Adicione lançamentos ou conecte uma integração para ver os resultados.</p>
            )}
            {(mockCashflowData || []).map((m: any) => (
              <div key={m.month} className="flex justify-between items-center p-2.5 rounded bg-black/15 border border-[var(--border-soft)]">
                <div className="flex items-center gap-2">
                  <Calendar size={13} className="text-brand" />
                  <span className="font-semibold text-xs text-[var(--text-primary)]">{m.month}</span>
                </div>
                <div className="text-right font-mono text-xs">
                  <p className={(Number(m.balance) || 0) >= 0 ? 'text-green-500 font-bold' : 'text-red-500 font-bold'}>
                    {formatCurrency(Number(m.balance) || 0)}
                  </p>
                  <p className="text-[9px] text-[var(--text-muted)]">
                    +{formatCurrency(Number(m.inflow) || 0)} / -{formatCurrency(Number(m.outflow) || 0)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
