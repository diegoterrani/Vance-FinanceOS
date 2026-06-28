import React, { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Building2, LogOut, ShieldAlert, Users, Layers } from 'lucide-react';
import Logo from '../components/Logo';
import Login from './Login';
import { supabase } from '../lib/supabase';
import * as db from '../lib/db';

const STATUS_STYLE: Record<string, string> = {
  trialing: 'bg-blue-500/10 text-blue-400',
  active: 'bg-emerald-500/10 text-emerald-400',
  past_due: 'bg-amber-500/10 text-amber-400',
  suspended: 'bg-red-500/10 text-red-400',
  canceled: 'bg-neutral-500/10 text-neutral-400',
};

export default function Backoffice() {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [isSuper, setIsSuper] = useState(false);
  const [tenants, setTenants] = useState<any[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (!s) { setIsSuper(false); setChecking(false); }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const uid = session?.user?.id;
    if (!uid) return;
    let active = true;
    (async () => {
      const { data: prof } = await supabase.from('profiles').select('is_super_admin').eq('id', uid).single();
      if (!active) return;
      const su = !!prof?.is_super_admin;
      setIsSuper(su);
      if (su) {
        try { setTenants(await db.fetchAllTenants()); } catch (e) { console.error(e); }
      }
      setChecking(false);
    })();
    return () => { active = false; };
  }, [session?.user?.id]);

  const logout = async () => { await supabase.auth.signOut(); };

  if (checking) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#0A0A0A] text-white">
        <p className="text-xs text-[#A3A3A3] animate-pulse">Carregando backoffice…</p>
      </div>
    );
  }

  if (!session) return <Login />;

  if (!isSuper) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#0A0A0A] text-white px-4">
        <div className="text-center max-w-sm">
          <ShieldAlert size={32} className="mx-auto text-red-500" />
          <h1 className="mt-3 text-lg font-bold">Acesso restrito</h1>
          <p className="mt-1 text-xs text-[#A3A3A3]">Esta área é exclusiva para super-administradores da Iron Security.</p>
          <button onClick={logout} className="mt-5 text-xs font-semibold px-4 py-2 rounded-lg border border-[#2a2a2a] hover:bg-[#1a1a1a]">Sair</button>
        </div>
      </div>
    );
  }

  const totalUsers = tenants.reduce((s, t) => s + (t.userCount || 0), 0);
  const active = tenants.filter(t => t.status === 'active').length;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5] font-sans">
      <header className="flex items-center justify-between px-6 py-4 border-b border-[#1c1c1c]">
        <div className="flex items-center gap-3">
          <Logo showText size="sm" className="text-white" />
          <span className="text-[10px] uppercase tracking-widest text-[#737373] border border-[#222] px-2 py-0.5 rounded">Backoffice</span>
        </div>
        <button onClick={logout} className="flex items-center gap-1.5 text-xs text-[#A3A3A3] hover:text-white">
          <LogOut size={14} /> Sair
        </button>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-[#0E0E0E] border border-[#1c1c1c]">
            <div className="flex items-center gap-2 text-[#A3A3A3] text-xs"><Layers size={14} /> Tenants</div>
            <p className="text-2xl font-extrabold mt-1">{tenants.length}</p>
          </div>
          <div className="p-4 rounded-xl bg-[#0E0E0E] border border-[#1c1c1c]">
            <div className="flex items-center gap-2 text-[#A3A3A3] text-xs"><Building2 size={14} /> Ativos</div>
            <p className="text-2xl font-extrabold mt-1">{active}</p>
          </div>
          <div className="p-4 rounded-xl bg-[#0E0E0E] border border-[#1c1c1c]">
            <div className="flex items-center gap-2 text-[#A3A3A3] text-xs"><Users size={14} /> Usuários</div>
            <p className="text-2xl font-extrabold mt-1">{totalUsers}</p>
          </div>
        </div>

        {/* Tenants table */}
        <div className="rounded-xl bg-[#0E0E0E] border border-[#1c1c1c] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#1c1c1c] text-sm font-semibold">Clientes (Tenants)</div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-[#737373] text-[10px] uppercase tracking-wider">
                <tr className="border-b border-[#1c1c1c]">
                  <th className="text-left px-4 py-2">Tenant</th>
                  <th className="text-left px-4 py-2">Status</th>
                  <th className="text-left px-4 py-2">Plano</th>
                  <th className="text-left px-4 py-2">Responsável</th>
                  <th className="text-right px-4 py-2">Usuários</th>
                  <th className="text-left px-4 py-2">Trial até</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map(t => (
                  <tr key={t.id} className="border-b border-[#161616] hover:bg-[#141414]">
                    <td className="px-4 py-2.5 font-semibold">{t.name}</td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${STATUS_STYLE[t.status] || ''}`}>{t.status}</span>
                    </td>
                    <td className="px-4 py-2.5 text-[#A3A3A3]">{t.plan?.name || '—'}</td>
                    <td className="px-4 py-2.5 text-[#A3A3A3]">{t.owner?.email || '—'}</td>
                    <td className="px-4 py-2.5 text-right">{t.userCount}</td>
                    <td className="px-4 py-2.5 text-[#A3A3A3]">{t.trialEndsAt ? new Date(t.trialEndsAt).toLocaleDateString('pt-BR') : '—'}</td>
                  </tr>
                ))}
                {tenants.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-[#737373]">Nenhum tenant.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-[11px] text-[#737373]">
          F4 adiciona: financeiro (MRR/inadimplência), planos, chamados, consumo de recursos e impersonação auditada.
        </p>
      </main>
    </div>
  );
}
