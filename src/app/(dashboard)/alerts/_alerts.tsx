'use client';

import React, { useState } from 'react';
import { Alert, AlertLevel } from '@/lib/types';
import { AlertTriangle, ShieldAlert, CheckCircle, Info, Filter, Clock, Check, BellRing } from 'lucide-react';

interface AlertsProps {
  alerts: Alert[];
  onResolveAlert: (id: string) => void;
  onSnoozeAlert: (id: string, durationHours: number) => void;
}

export default function Alerts({
  alerts,
  onResolveAlert,
  onSnoozeAlert
}: AlertsProps) {
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filteredAlerts = alerts.filter(alert => {
    if (levelFilter !== 'all' && alert.level !== levelFilter) return false;
    if (categoryFilter !== 'all' && alert.category !== categoryFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex justify-between items-center bg-black/5 p-4 rounded-xl border border-[var(--border-soft)]">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Central de Alertas e Notificações</h1>
          <p className="text-xs text-[var(--text-secondary)]">Diagnósticos de saúde operacional do sistema, avisos tributários e limites de margem</p>
        </div>
      </div>

      {/* Grid: Alert filters & summary list */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Side: Filter Sidebar */}
        <div className="lg:col-span-1 p-4 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] space-y-4 h-fit">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-2 pb-2 border-b border-[var(--border-soft)]">
            <Filter size={13} /> Filtrar Alertas
          </h3>

          {/* Level Filter */}
          <div className="space-y-2">
            <label className="text-xs text-[var(--text-secondary)] block">Severidade</label>
            <div className="space-y-1">
              {['all', 'critical', 'high', 'medium', 'info'].map(lvl => (
                <button
                  key={lvl}
                  onClick={() => setLevelFilter(lvl)}
                  className={`w-full text-left px-3 py-1.5 rounded text-xs transition-colors capitalize ${
                    levelFilter === lvl
                      ? 'bg-brand/10 text-brand font-bold border-l-2 border-brand'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]'
                  }`}
                >
                  {lvl === 'all' ? 'Ver Todos' :
                   lvl === 'critical' ? 'Crítico (Prioridade S0)' :
                   lvl === 'high' ? 'Alta (Prioridade S1)' :
                   lvl === 'medium' ? 'Médio (Prioridade S2)' : 'Informações'}
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div className="space-y-2 pt-2 border-t border-[var(--border-soft)]">
            <label className="text-xs text-[var(--text-secondary)] block">Módulo do Sistema</label>
            <div className="space-y-1">
              {[
                { id: 'all', label: 'Todos os Módulos' },
                { id: 'Conciliação', label: 'Conciliação Bancária' },
                { id: 'Faturamento', label: 'Faturamento & Boletos' },
                { id: 'Open Finance', label: 'Integração Open Finance' },
                { id: 'Configurações', label: 'Auditorias de Segurança' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`w-full text-left px-3 py-1.5 rounded text-xs transition-colors ${
                    categoryFilter === cat.id
                      ? 'bg-brand/10 text-brand font-bold border-l-2 border-brand'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[var(--border-soft)] text-[10px] text-[var(--text-muted)] flex items-center gap-1.5">
            <BellRing size={12} className="text-teal-500 animate-pulse" />
            <span>Sincronizando via webhooks a cada 30 segundos.</span>
          </div>
        </div>

        {/* Right Side: Alerts interactive list */}
        <div className="lg:col-span-3 space-y-4">
          
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Fila de Alertas ({filteredAlerts.length})
            </h2>
          </div>

          <div className="space-y-3">
            {filteredAlerts.length === 0 ? (
              <div className="p-12 text-center border border-[var(--border-soft)] rounded-xl bg-[var(--bg-card)] flex flex-col items-center justify-center space-y-3">
                <CheckCircle size={40} className="text-green-500 opacity-80" />
                <p className="text-sm font-semibold">Tudo ideal!</p>
                <p className="text-xs text-[var(--text-secondary)]">Não há diagnósticos que demandem a sua atenção nos filtros aplicados.</p>
              </div>
            ) : (
              filteredAlerts.map(alert => {
                // Decorate visual container
                let cardBorder = 'border-[var(--border-soft)] bg-[var(--bg-card)]';
                let levelBadge = 'bg-blue-500/10 text-blue-500';
                let Icon = Info;

                if (alert.level === 'critical') {
                  cardBorder = 'border-red-500/30 bg-red-500/5';
                  levelBadge = 'bg-red-500/20 text-red-500';
                  Icon = ShieldAlert;
                } else if (alert.level === 'high') {
                  cardBorder = 'border-orange-500/30 bg-orange-500/5';
                  levelBadge = 'bg-orange-500/20 text-orange-500';
                  Icon = AlertTriangle;
                } else if (alert.level === 'medium') {
                  cardBorder = 'border-amber-500/30 bg-amber-500/5';
                  levelBadge = 'bg-amber-500/20 text-amber-500';
                  Icon = AlertTriangle;
                }

                return (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-xl border transition-all ${cardBorder} ${
                      alert.status !== 'active' ? 'opacity-50' : ''
                    } flex flex-col sm:flex-row justify-between items-start gap-4`}
                  >
                    <div className="flex gap-3">
                      <div className={`p-2 rounded-lg ${levelBadge} self-start`}>
                        <Icon size={18} />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-1.5 py-0.25 font-mono text-[9px] uppercase font-bold rounded ${levelBadge}`}>
                            {alert.level}
                          </span>
                          <span className="text-[10px] text-teal-500 font-semibold">{alert.category}</span>
                          <span className="text-[10px] text-[var(--text-muted)] font-mono">{alert.date}</span>
                        </div>
                        <h4 className="font-bold text-sm text-[var(--text-primary)]">{alert.title}</h4>
                        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{alert.description}</p>
                        
                        {alert.status === 'snoozed' && (
                          <p className="text-[10px] text-amber-600 font-mono flex items-center gap-1 mt-1.5">
                            <Clock size={11} /> Adiado até {alert.snoozedUntil}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Interactive operations inside standard alert container */}
                    {alert.status === 'active' && (
                      <div className="flex sm:flex-col gap-1.5 self-end sm:self-center">
                        <button
                          onClick={() => onResolveAlert(alert.id)}
                          className="px-3 py-1.5 bg-green-500 text-white rounded text-xs font-semibold hover:bg-green-600 transition-colors cursor-pointer flex items-center justify-center gap-1 whitespace-nowrap"
                        >
                          <Check size={12} /> Resolver
                        </button>
                        <div className="flex gap-1">
                          <button
                            onClick={() => onSnoozeAlert(alert.id, 1)}
                            className="p-1.5 rounded border border-[var(--border-soft)] bg-[var(--bg-input)] hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer text-xs"
                            title="Adiar por 1 hora"
                          >
                            +1h
                          </button>
                          <button
                            onClick={() => onSnoozeAlert(alert.id, 24)}
                            className="p-1.5 rounded border border-[var(--border-soft)] bg-[var(--bg-input)] hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer text-xs"
                            title="Adiar por 1 dia"
                          >
                            +1dia
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
