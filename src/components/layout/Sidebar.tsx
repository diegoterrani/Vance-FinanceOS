import React from 'react';
import Logo from '../Logo';
import { LayoutDashboard, FileSpreadsheet, TrendingUp, AlertTriangle, Settings, ChevronLeft, ChevronRight, Wallet, ClipboardList, X } from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  alertCount: number;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({
  currentView,
  onNavigate,
  collapsed,
  onToggleCollapse,
  alertCount,
  mobileOpen = false,
  onCloseMobile
}: SidebarProps) {
  const menuItems = [
    { id: 'overview', label: 'Monitor Geral', icon: LayoutDashboard },
    { id: 'registers', label: 'Cadastros AP/AR', icon: ClipboardList },
    { id: 'reconciliation', label: 'Conciliação Bancária', icon: FileSpreadsheet, badge: 23 },
    { id: 'cashflow', label: 'Fluxo de Caixa', icon: TrendingUp },
    { id: 'alerts', label: 'Central de Alertas', icon: AlertTriangle, badge: alertCount, badgeType: 'alert' },
    { id: 'settings', label: 'Configurações', icon: Settings }
  ];

  return (
    <aside
      className={`fixed top-0 z-40 h-screen border-r border-[var(--border-soft)] bg-[var(--bg-sidebar)] text-[var(--text-primary)] transition-all duration-300 flex flex-col lg:left-0
        ${collapsed ? 'lg:w-16' : 'lg:w-[250px]'}
        ${mobileOpen ? 'left-0 w-[250px] shadow-2xl' : '-left-64'}
      `}
    >
      {/* Sidebar Header Brand Area */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[var(--border-soft)]">
        <Logo size={collapsed ? 'sm' : 'md'} showText={!collapsed} className="transition-all" />
        
        {/* Compact / Close controllers */}
        <div className="flex items-center gap-1">
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-md hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              title="Fechar menu"
            >
              <X size={16} />
            </button>
          )}
          {!collapsed && (
            <button
              onClick={onToggleCollapse}
              className="hidden lg:block p-1 rounded-md hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] transition-colors cursor-pointer"
              title="Compactar menu"
            >
              <ChevronLeft size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Navigation menu */}
      <nav className="flex-1 py-4 space-y-1.5 px-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id || (item.id === 'settings' && currentView.startsWith('settings'));

          return (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                onCloseMobile?.();
              }}
              className={`w-full flex items-center rounded-lg transition-all px-3 py-2.5 text-xs font-medium cursor-pointer group relative ${
                isActive
                  ? 'bg-brand/10 text-brand border-l-2 border-brand font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'
              }`}
            >
              <Icon size={18} className={`flex-shrink-0 ${isActive ? 'text-brand' : 'opacity-80 group-hover:opacity-100'}`} />
              
              {!collapsed && (
                <span className="ml-3 font-sans truncate">{item.label}</span>
              )}

              {/* Collapsed Tooltip */}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-[var(--bg-card)] border border-[var(--border-mid)] text-[var(--text-primary)] text-xs rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-md">
                  {item.label}
                </div>
              )}

              {/* Status Badges */}
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`absolute right-3 px-1.5 py-0.25 text-[9px] font-mono font-bold rounded-full ${
                    item.badgeType === 'alert'
                      ? 'bg-red-500/15 text-red-500'
                      : 'bg-amber-500/15 text-amber-500'
                  } ${collapsed ? 'top-1 right-2 scale-75' : ''}`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Small Toggle footer for collapsed layout */}
      {collapsed && (
        <div className="p-3 border-t border-[var(--border-soft)] flex justify-center">
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-md hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] cursor-pointer"
            title="Expandir menu"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Small Workspace Indicator in non-collapsed sidebar */}
      {!collapsed && (
        <div className="p-3 border-t border-[var(--border-soft)] bg-black/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-500 text-xs font-bold border border-teal-500/20">
              <Wallet size={15} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[var(--text-primary)] truncate">Vance Financeiro</p>
              <p className="text-[10px] text-green-500 flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                Operacional
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
