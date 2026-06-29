import React, { useState } from 'react';
import { Sun, Moon, Bell, Search, AlertOctagon, HelpCircle, Check, ShieldAlert, ArrowUpRight, Menu, LogOut, Shield } from 'lucide-react';
import { Alert, PluggyAccount, User, Company, UserRole } from '../../types';
import { formatCurrency } from '../../lib/formatters';

interface HeaderProps {
  currentView: string;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  activeAlerts: Alert[];
  onResolveAlert: (id: string) => void;
  onNavigate: (view: string) => void;
  companyName: string;
  onToggleMobileMenu?: () => void;
  currentUser: User | null;
  onLogout?: () => void;
  onOpenSettingsModal?: () => void;
  companies: Company[];
  selectedCompanyCnpj: string;
  onSelectCompanyCnpj: (cnpj: string) => void;
  onChangeRole?: (role: UserRole) => void;
}

export default function Header({
  currentView,
  theme,
  onToggleTheme,
  activeAlerts,
  onResolveAlert,
  onNavigate,
  companyName,
  onToggleMobileMenu,
  currentUser,
  onLogout,
  onOpenSettingsModal,
  companies,
  selectedCompanyCnpj,
  onSelectCompanyCnpj,
  onChangeRole
}: HeaderProps) {
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Breadcrumb computations
  const getBreadcrumbs = () => {
    const list = [{ label: 'Vance OS', id: 'overview' }];
    if (currentView === 'overview') {
      list.push({ label: 'Monitor Geral', id: 'overview' });
    } else if (currentView === 'registers') {
      list.push({ label: 'Contas a PAGAR/RECEBER', id: 'registers' });
    } else if (currentView === 'reconciliation') {
      list.push({ label: 'Fila de Conciliação', id: 'reconciliation' });
    } else if (currentView === 'cashflow') {
      list.push({ label: 'Fluxo de Caixa', id: 'cashflow' });
    } else if (currentView === 'alerts') {
      list.push({ label: 'Central de Alertas', id: 'alerts' });
    } else if (currentView.startsWith('settings')) {
      list.push({ label: 'Painel de Configuração', id: 'settings' });
    }
    return list;
  };

  const breadcrumbs = getBreadcrumbs();

  // Filter alerts by importance
  const unreadAlerts = activeAlerts.filter(a => a.status === 'active');
  const criticalBannerAlerts = unreadAlerts.filter(a => a.level === 'critical');

  return (
    <div className="z-30 w-full flex flex-col sticky top-0 bg-[var(--bg-header)] border-b border-[var(--border-soft)] backdrop-blur-md">
      
      {/* 1. CRITICAL ALERT BANNER (If any exists) */}
      {criticalBannerAlerts.map((alert) => (
        <div
          key={alert.id}
          className="bg-red-500 text-white text-xs font-medium py-2 px-4 flex items-center justify-between gap-3 animate-pulse"
        >
          <div className="flex items-center gap-2">
            <AlertOctagon size={14} className="flex-shrink-0 animate-bounce" />
            <span>
              <strong>ALERTA CRÍTICO:</strong> {alert.title} — {alert.description}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('alerts')}
              className="underline font-bold hover:text-white/85 text-xs flex items-center gap-0.5"
            >
              Exibir <ArrowUpRight size={11} />
            </button>
            <button
              onClick={() => onResolveAlert(alert.id)}
              className="bg-[var(--bg-card-hover)] hover:bg-[var(--bg-input)] text-[10px] px-2 py-0.5 rounded font-mono uppercase"
            >
              Encerrar
            </button>
          </div>
        </div>
      ))}

      {/* 2. MAIN HEADER BAR */}
      <div className="h-16 px-4 md:px-6 flex items-center justify-between gap-4">
        
        {/* Left Area: Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs font-medium">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="p-1.5 -ml-1.5 rounded-lg hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer lg:hidden"
              title="Menu"
            >
              <Menu size={18} />
            </button>
          )}
          {breadcrumbs.map((bc, idx) => (
            <React.Fragment key={`${bc.id}-${idx}`}>
              {idx > 0 && <span className="text-[var(--text-muted)] font-mono">/</span>}
              <button
                onClick={() => onNavigate(bc.id)}
                className={`transition-colors cursor-pointer ${
                  idx === breadcrumbs.length - 1
                    ? 'text-[var(--text-primary)] font-semibold'
                    : 'text-[var(--text-secondary)] hover:text-brand'
                }`}
              >
                {bc.label}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Center Area: Selected Company Indicator & Selector */}
        <div className="flex items-center gap-2 px-3 py-1 bg-[var(--bg-input)] rounded-full border border-[var(--border-soft)]">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shrink-0"></span>
          <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Visão:</span>
          <select
            value={selectedCompanyCnpj}
            onChange={(e) => onSelectCompanyCnpj(e.target.value)}
            className="bg-transparent border-none text-[11px] font-bold text-teal-400 focus:outline-none pr-1 cursor-pointer hover:text-teal-300 transition-colors uppercase font-sans select-none"
            id="global-cnpj-selector"
          >
            <option value="consolidado" className="bg-[var(--bg-card)] text-[var(--text-primary)]">🌐 TODOS OS CNPJs (Consolidado)</option>
            {companies?.map(company => (
              <option key={company.cnpj} value={company.cnpj} className="bg-[var(--bg-card)] text-[var(--text-primary)]">
                🏢 {company.nomeFantasia} ({company.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")})
              </option>
            ))}
          </select>
        </div>

        {/* Right Area: Actions (Search, Notification, Theme, Avatar) */}
        <div className="flex items-center gap-3">
          
          {/* Quick Search */}
          <div className="relative hidden lg:block">
            <Search size={14} className="absolute left-3 top-2.5 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Pesquisar transações, notas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-64 pl-9 pr-4 text-xs rounded-lg border border-[var(--border-soft)] bg-[var(--bg-input)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--border-strong)] transition-all"
            />
          </div>



          {/* Dark / Light Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-lg hover:bg-[var(--bg-card-hover)] border border-[var(--border-soft)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            title={theme === 'dark' ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* Notifications Trigger */}
          <div className="relative">
            <button
              onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
              className="p-2 relative rounded-lg hover:bg-[var(--bg-card-hover)] border border-[var(--border-soft)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              <Bell size={15} />
              {unreadAlerts.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-[9px] text-white font-mono font-black flex items-center justify-center rounded-full">
                  {unreadAlerts.length}
                </span>
              )}
            </button>

            {/* Notification Dropdown Panel */}
            {showNotificationDropdown && (
              <div className="absolute right-0 mt-2 w-80 bg-[var(--bg-card)] border border-[var(--border-strong)] rounded-xl shadow-2xl z-50 overflow-hidden text-xs">
                <div className="p-3 border-b border-[var(--border-soft)] bg-[var(--bg-card)] flex items-center justify-between">
                  <span className="font-semibold text-[var(--text-primary)]">Alertas Recentes ({unreadAlerts.length})</span>
                  <button
                    onClick={() => {
                      setShowNotificationDropdown(false);
                      onNavigate('alerts');
                    }}
                    className="text-[10px] text-teal-500 hover:underline"
                  >
                    Ver todosos
                  </button>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-[var(--border-soft)]">
                  {unreadAlerts.length === 0 ? (
                    <div className="p-6 text-center text-[var(--text-muted)]">
                      Nenhum alerta pendente. Operação ideal.
                    </div>
                  ) : (
                    unreadAlerts.slice(0, 5).map((alert) => (
                      <div key={alert.id} className="p-3 hover:bg-[var(--bg-card-hover)] flex gap-2.5 items-start">
                        <span className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${
                          alert.level === 'critical' ? 'bg-red-500' :
                          alert.level === 'high' ? 'bg-orange-500' :
                          alert.level === 'medium' ? 'bg-amber-500' : 'bg-blue-400'
                        }`} />
                        <div className="flex-1">
                          <p className="font-bold text-[var(--text-primary)] leading-tight">{alert.title}</p>
                          <p className="text-[var(--text-secondary)] text-[11px] mt-0.5 leading-snug">{alert.description}</p>
                          <div className="flex items-center gap-3 mt-1.5 pt-1.5 border-t border-[var(--border-soft)]">
                            <span className="text-[10px] font-mono text-[var(--text-muted)]">{alert.date}</span>
                            <button
                              onClick={() => onResolveAlert(alert.id)}
                              className="text-[10px] text-green-500 hover:underline flex items-center gap-0.5 ml-auto cursor-pointer"
                            >
                              <Check size={10} /> Resolvido
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User profile dropdown simulator */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 pl-2 border-l border-[var(--border-soft)] hover:opacity-85 transition-opacity cursor-pointer text-left focus:outline-none"
            >
              <img
                src={currentUser?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100"}
                alt={currentUser?.name || "User Avatar"}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full border border-teal-500/30 object-cover flex-shrink-0"
              />
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-[var(--text-primary)] max-w-[120px] truncate">{currentUser?.name || 'Visitante'}</p>
                <p className="text-[10px] text-[var(--text-secondary)] capitalize">{currentUser?.role || 'Acesso'}</p>
              </div>
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-[var(--bg-card)] border border-[var(--border-strong)] rounded-xl shadow-2xl z-50 overflow-hidden text-xs py-1">
                <div className="px-3 py-2 border-b border-[var(--border-soft)]">
                  <p className="font-bold text-[var(--text-primary)] truncate">{currentUser?.name}</p>
                  <p className="text-[10px] text-[var(--text-muted)] truncate">{currentUser?.email}</p>
                  <span className="inline-flex mt-1 px-1.5 py-0.5 text-[8px] font-mono rounded bg-brand/10 text-brand font-bold uppercase">
                    Cargo: {currentUser?.role}
                  </span>
                </div>
                
                {onChangeRole && (
                  <div className="px-3 py-2.5 border-b border-[var(--border-soft)] bg-[var(--bg-card-hover)]">
                    <p className="text-[9px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Shield size={10} className="text-teal-500 animate-pulse" />
                      Trocar Papel (Sandbox)
                    </p>
                    <select
                      value={currentUser?.role}
                      onChange={(e) => {
                        onChangeRole(e.target.value as UserRole);
                      }}
                      className="w-full bg-[var(--bg-input)] text-[var(--text-primary)] border border-[var(--border-soft)] rounded px-2 py-1 text-[11px] font-medium focus:outline-none focus:border-brand cursor-pointer"
                    >
                      <option value="viewer">Observador (Viewer)</option>
                      <option value="analista">Analista</option>
                      <option value="tesouraria">Tesoureiro</option>
                      <option value="gerencia">Gerência</option>
                      <option value="diretor">Diretor</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                )}

                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    onLogout?.();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-red-400 hover:bg-neutral-900 hover:text-red-300 transition-colors cursor-pointer border-none bg-transparent mt-1"
                >
                  <LogOut size={13} />
                  <span>Sair da Conta</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
