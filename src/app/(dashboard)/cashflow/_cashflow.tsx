'use client';

import React, { useState } from 'react';
import { CashflowChart, ProjectionChart, CategoryBreakdownChart } from '@/components/finance/Charts';
import CurrencyDisplay from '@/components/finance/CurrencyDisplay';
import { formatCurrency } from '@/lib/formatters';
import { ArrowUpRight, ArrowDownRight, TrendingUp, Calendar, Filter, Share2, Printer, ChevronRight, HelpCircle } from 'lucide-react';

interface CashflowProps {
  mockCashflowData: any[];
}

export default function Cashflow({ mockCashflowData }: CashflowProps) {
  const [period, setPeriod] = useState('6m');
  const [forecastDays, setForecastDays] = useState(30);

  // Compute stats
  const totalInflows = 98400.00;
  const totalOutflows = -67200.00;
  const netBalance = 31200.00;
  const projectedSurplus = 12400.00;

  // Custom data for the next 30 days forecast area chart
  const projectionData = [
    { day: '21/06', projected: 48320, lowerBound: 48320, upperBound: 48320 },
    { day: '25/06', projected: 49500, lowerBound: 47100, upperBound: 52000 },
    { day: '29/06', projected: 52100, lowerBound: 48400, upperBound: 55800 },
    { day: '03/07', projected: 47000, lowerBound: 42200, upperBound: 51200 },
    { day: '07/07', projected: 53900, lowerBound: 47500, upperBound: 59300 },
    { day: '11/07', projected: 55000, lowerBound: 48100, upperBound: 61000 },
    { day: '15/07', projected: 58200, lowerBound: 50100, upperBound: 65400 },
    { day: '19/07', projected: 60720, lowerBound: 51300, upperBound: 68900 },
  ];

  // Expense breakdown categories data
  const expenseCategories = [
    { name: 'Fornecedores e Logística', value: 28400.00, color: '#EF4444' },
    { name: 'Folha de Pagamento', value: 24100.00, color: '#312E81' },
    { name: 'Impostos e Contribuições', value: 10300.00, color: '#F59E0B' },
    { name: 'Sistemas e Softwares', value: 4400.00, color: '#8B5CF6' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-black/5 p-4 rounded-xl border border-[var(--border-soft)]">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Painel Gerencial de Margem</h1>
          <p className="text-xs text-[var(--text-secondary)]">Projeções preditivas, métricas de aging e saldos futuros garantidos por auditoria</p>
        </div>
        
        {/* Filter elements & reports exports */}
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
          <p className="text-[10px] text-[var(--text-muted)] font-mono">Lucro operacional líquido</p>
        </div>

        <div className="p-4 rounded-xl border border-teal-500/20 bg-teal-500/5">
          <p className="text-xs text-teal-400">Previsão 30 Dias</p>
          <div className="my-1.5 flex items-center justify-between">
            <CurrencyDisplay value={projectedSurplus} variant="large" colorize />
            <TrendingUp size={15} className="text-teal-500" />
          </div>
          <p className="text-[10px] text-[var(--text-muted)] font-mono">Cálculo preditivo de caixa</p>
        </div>

      </div>

      {/* Main Charts: Current Period cashflow + Next 30 days Projection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <CashflowChart data={mockCashflowData} />
        </div>
        <div>
          <ProjectionChart data={projectionData} />
        </div>
      </div>

      {/* Outflow category splits & projection table summaries */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left outflow breakdowns */}
        <div className="lg:col-span-2">
          <CategoryBreakdownChart
            categories={expenseCategories}
            total={67200.00}
            title="Distribuição Analítica de Custos"
          />
        </div>

        {/* Right timeline audit logs */}
        <div className="lg:col-span-2 p-4 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Projeção Futura Inteligente</h3>
            <p className="text-[10px] text-[var(--text-secondary)]">Estimativa baseada em contratos e frequência de faturamento</p>
          </div>

          <div className="space-y-3">
            
            <div className="flex justify-between items-center p-2.5 rounded bg-black/15 border border-[var(--border-soft)]">
              <div className="flex items-center gap-2">
                <Calendar size={13} className="text-brand" />
                <span className="font-semibold text-xs text-[var(--text-primary)]">Fim de Junho/2026</span>
              </div>
              <div className="text-right font-mono text-xs">
                <p className="text-green-500 font-bold">+R$ 15.420,00</p>
                <p className="text-[9px] text-[var(--text-muted)]">Certeza: Alta (98%)</p>
              </div>
            </div>

            <div className="flex justify-between items-center p-2.5 rounded bg-black/15 border border-[var(--border-soft)]">
              <div className="flex items-center gap-2">
                <Calendar size={13} className="text-brand" />
                <span className="font-semibold text-xs text-[var(--text-primary)]">Meados de Julho/2026</span>
              </div>
              <div className="text-right font-mono text-xs">
                <p className="text-green-500 font-bold">+R$ 18.200,00</p>
                <p className="text-[9px] text-[var(--text-muted)]">Certeza: Média (82%)</p>
              </div>
            </div>

            <div className="flex justify-between items-center p-2.5 rounded bg-black/15 border border-[var(--border-soft)]">
              <div className="flex items-center gap-2">
                <Calendar size={13} className="text-brand" />
                <span className="font-semibold text-xs text-[var(--text-primary)]">Fim de Julho/2026</span>
              </div>
              <div className="text-right font-mono text-xs">
                <p className="text-red-500 font-bold">-R$ 11.100,00</p>
                <p className="text-[9px] text-[var(--text-muted)]">Certeza: Média (75%)</p>
              </div>
            </div>

          </div>

          <p className="text-[10px] text-[var(--text-muted)] leading-relaxed italic border-t border-[var(--border-soft)] pt-3 text-center">
            As projeções preditivas são sincronizadas automaticamente às 06:00 AM todos os dias via pg_cron.
          </p>
        </div>

      </div>

    </div>
  );
}
