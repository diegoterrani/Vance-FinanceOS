import React, { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { LogOut, ShieldAlert, Users, Layers, DollarSign, AlertTriangle, Save, Plus } from 'lucide-react';
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
const brl = (cents: number) => `R$ ${((cents || 0) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

export default function Backoffice() {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [isSuper, setIsSuper] = useState(false);
  const [tab, setTab] = useState<'overview' | 'plans'>('overview');
  const [data, setData] = useState<{ tenants: any[]; plans: any[]; finance: any } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); if (!data.session) setChecking(false); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { setSession(s); if (!s) { setIsSuper(false); setChecking(false); } });
    return () => sub.subscription.unsubscribe();
  }, []);

  const reload = async () => { try { setData(await db.fetchBackoffice()); } catch (e) { console.error(e); } };

  useEffect(() => {
    const uid = session?.user?.id;
    if (!uid) return;
    let active = true;
    (async () => {
      const { data: prof } = await supabase.from('profiles').select('is_super_admin').eq('id', uid).single();
      if (!active) return;
      const su = !!prof?.is_super_admin;
      setIsSuper(su);
      if (su) await reload();
      setChecking(false);
    })();
    return () => { active = false; };
  }, [session?.user?.id]);

  const logout = async () => { await supabase.auth.signOut(); };

  const setTenantStatus = async (id: string, status: string) => {
    await db.updateTenantFields(id, status === 'active' ? { status, past_due_since: null } : { status });
    reload();
  };
  const setTenantPlan = async (id: string, planId: string) => { await db.updateTenantFields(id, { plan_id: planId }); reload(); };

  if (checking) return <div className="min-h-screen grid place-items-center bg-[#0A0A0A] text-white"><p className="text-xs text-[#A3A3A3] animate-pulse">Carregando backoffice…</p></div>;
  if (!session) return <Login />;
  if (!isSuper) return (
    <div className="min-h-screen grid place-items-center bg-[#0A0A0A] text-white px-4">
      <div className="text-center max-w-sm">
        <ShieldAlert size={32} className="mx-auto text-red-500" />
        <h1 className="mt-3 text-lg font-bold">Acesso restrito</h1>
        <p className="mt-1 text-xs text-[#A3A3A3]">Área exclusiva para super-administradores da Iron Security.</p>
        <button onClick={logout} className="mt-5 text-xs font-semibold px-4 py-2 rounded-lg border border-[#2a2a2a] hover:bg-[#1a1a1a]">Sair</button>
      </div>
    </div>
  );

  const f = data?.finance;
  const tenants = data?.tenants || [];
  const plans = data?.plans || [];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5] font-sans">
      <header className="flex items-center justify-between px-6 py-4 border-b border-[#1c1c1c]">
        <div className="flex items-center gap-3">
          <Logo showText size="sm" className="text-white" />
          <span className="text-[10px] uppercase tracking-widest text-[#737373] border border-[#222] px-2 py-0.5 rounded">Backoffice</span>
        </div>
        <button onClick={logout} className="flex items-center gap-1.5 text-xs text-[#A3A3A3] hover:text-white"><LogOut size={14} /> Sair</button>
      </header>

      <div className="max-w-6xl mx-auto px-6 pt-6">
        <div className="flex gap-2 text-xs">
          {(['overview', 'plans'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg font-semibold ${tab === t ? 'bg-[#1a1a1a] text-white border border-[#2a2a2a]' : 'text-[#A3A3A3] hover:text-white'}`}>
              {t === 'overview' ? 'Visão geral' : 'Planos'}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {tab === 'overview' && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Kpi icon={<DollarSign size={14} />} label="MRR" value={brl(f?.mrr || 0)} />
              <Kpi icon={<Layers size={14} />} label="Assinaturas ativas" value={String(f?.active || 0)} />
              <Kpi icon={<AlertTriangle size={14} />} label="Inadimplentes" value={String((f?.pastDue || 0) + (f?.suspended || 0))} accent="amber" />
              <Kpi icon={<Users size={14} />} label="Em trial" value={String(f?.trialing || 0)} />
              <Kpi icon={<DollarSign size={14} />} label="Recebido" value={brl(f?.received || 0)} accent="emerald" />
              <Kpi icon={<DollarSign size={14} />} label="Em aberto" value={brl(f?.open || 0)} accent="amber" />
              <Kpi icon={<Layers size={14} />} label="Tenants" value={String(tenants.length)} />
              <Kpi icon={<AlertTriangle size={14} />} label="Suspensos" value={String(f?.suspended || 0)} accent="red" />
            </div>

            <div className="rounded-xl bg-[#0E0E0E] border border-[#1c1c1c] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#1c1c1c] text-sm font-semibold">Clientes (Tenants)</div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="text-[#737373] text-[10px] uppercase tracking-wider">
                    <tr className="border-b border-[#1c1c1c]">
                      <th className="text-left px-4 py-2">Tenant</th><th className="text-left px-4 py-2">Status</th>
                      <th className="text-left px-4 py-2">Plano</th><th className="text-left px-4 py-2">Responsável</th>
                      <th className="text-right px-4 py-2">Users</th><th className="text-right px-4 py-2">Empresas</th>
                      <th className="text-right px-4 py-2">Lançam.</th><th className="text-right px-4 py-2">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenants.map(t => (
                      <tr key={t.id} className="border-b border-[#161616] hover:bg-[#141414]">
                        <td className="px-4 py-2.5 font-semibold">{t.name}</td>
                        <td className="px-4 py-2.5"><span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${STATUS_STYLE[t.status] || ''}`}>{t.status}</span></td>
                        <td className="px-4 py-2.5">
                          <select value={t.planId || ''} onChange={e => setTenantPlan(t.id, e.target.value)}
                            className="bg-[#1A1A1A] border border-[#222] rounded px-2 py-1 text-[11px]">
                            {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-2.5 text-[#A3A3A3]">{t.owner?.email || '—'}</td>
                        <td className="px-4 py-2.5 text-right">{t.userCount}</td>
                        <td className="px-4 py-2.5 text-right">{t.companyCount}</td>
                        <td className="px-4 py-2.5 text-right">{t.txCount}</td>
                        <td className="px-4 py-2.5 text-right">
                          {['active', 'trialing', 'past_due'].includes(t.status) ? (
                            <button onClick={() => setTenantStatus(t.id, 'suspended')} className="text-[10px] font-semibold px-2 py-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20">Suspender</button>
                          ) : (
                            <button onClick={() => setTenantStatus(t.id, 'active')} className="text-[10px] font-semibold px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20">Reativar</button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {tenants.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-[#737373]">Nenhum tenant.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {tab === 'plans' && <PlansEditor plans={plans} onSaved={reload} />}
      </main>
    </div>
  );
}

function Kpi({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: string }) {
  const color = accent === 'emerald' ? 'text-emerald-400' : accent === 'amber' ? 'text-amber-400' : accent === 'red' ? 'text-red-400' : 'text-white';
  return (
    <div className="p-4 rounded-xl bg-[#0E0E0E] border border-[#1c1c1c]">
      <div className="flex items-center gap-2 text-[#A3A3A3] text-[11px]">{icon} {label}</div>
      <p className={`text-xl font-extrabold mt-1 ${color}`}>{value}</p>
    </div>
  );
}

function PlansEditor({ plans, onSaved }: { plans: any[]; onSaved: () => void }) {
  const [draft, setDraft] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState('');

  const limitKeys = ['companies', 'users', 'transactions_month', 'ai_imports_month'];
  const get = (p: any, k: string) => (draft[p.code]?.[k] ?? p[k] ?? '');
  const getLimit = (p: any, k: string) => (draft[p.code]?.limits?.[k] ?? p.limits?.[k] ?? '');
  const set = (code: string, patch: any) => setDraft(d => ({ ...d, [code]: { ...d[code], ...patch } }));
  const setLim = (p: any, k: string, v: any) => set(p.code, { limits: { ...(draft[p.code]?.limits ?? p.limits ?? {}), [k]: Number(v) } });

  const save = async (p: any) => {
    setSaving(p.code);
    try {
      await db.savePlan({
        id: p.id, code: p.code,
        name: get(p, 'name'),
        price_cents: Math.round(Number(draft[p.code]?.price_reais ?? (p.price_cents / 100)) * 100),
        limits: { ...p.limits, ...(draft[p.code]?.limits || {}) },
        active: draft[p.code]?.active ?? p.active,
      });
      await onSaved();
      setDraft(d => { const n = { ...d }; delete n[p.code]; return n; });
    } catch (e: any) { alert('Falha ao salvar: ' + (e?.message || e)); }
    setSaving('');
  };

  return (
    <div className="space-y-4">
      {plans.map(p => (
        <div key={p.id} className="p-4 rounded-xl bg-[#0E0E0E] border border-[#1c1c1c]">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="text-[10px] uppercase text-[#737373]">Código</label>
              <p className="text-sm font-bold">{p.code}</p>
            </div>
            <Inp label="Nome" value={get(p, 'name')} onChange={(v: string) => set(p.code, { name: v })} />
            <Inp label="Preço (R$/mês)" type="number" value={String(draft[p.code]?.price_reais ?? (p.price_cents / 100))} onChange={(v: string) => set(p.code, { price_reais: v })} />
            {limitKeys.map(k => (
              <React.Fragment key={k}>
                <Inp label={k} type="number" w="w-24" value={String(getLimit(p, k))} onChange={(v: string) => setLim(p, k, v)} />
              </React.Fragment>
            ))}
            <label className="flex items-center gap-1.5 text-xs text-[#A3A3A3]">
              <input type="checkbox" checked={draft[p.code]?.active ?? p.active} onChange={e => set(p.code, { active: e.target.checked })} /> Ativo
            </label>
            <button onClick={() => save(p)} disabled={saving === p.code}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-[#F5F5F5] text-[#0A0A0A] hover:bg-white disabled:opacity-50">
              <Save size={13} /> {saving === p.code ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
          <p className="text-[10px] text-[#737373] mt-2">Limites: -1 = ilimitado.</p>
        </div>
      ))}
      <p className="text-[11px] text-[#737373] flex items-center gap-1"><Plus size={12} /> Para criar um novo tier, me peça (precisa de um novo `code`); ou edite os existentes acima.</p>
    </div>
  );
}

function Inp({ label, value, onChange, type = 'text', w = 'w-40' }: { label: string; value: string; onChange: (v: string) => void; type?: string; w?: string }) {
  return (
    <div>
      <label className="text-[10px] uppercase text-[#737373] block">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className={`${w} bg-[#1A1A1A] border border-[#222] rounded px-2 py-1.5 text-xs mt-0.5`} />
    </div>
  );
}
