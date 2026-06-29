import React, { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { LogOut, ShieldAlert, Users, Layers, DollarSign, AlertTriangle, Save, Plus, Eye, X, MessageSquare, Activity } from 'lucide-react';
import Logo from '../components/Logo';
import Login from './Login';
import { supabase } from '../lib/supabase';
import * as db from '../lib/db';

const STATUS_STYLE: Record<string, string> = {
  trialing: 'bg-blue-500/10 text-blue-400', active: 'bg-emerald-500/10 text-emerald-400',
  past_due: 'bg-amber-500/10 text-amber-400', suspended: 'bg-red-500/10 text-red-400', canceled: 'bg-neutral-500/10 text-[var(--text-secondary)]',
  open: 'bg-blue-500/10 text-blue-400', pending: 'bg-amber-500/10 text-amber-400', resolved: 'bg-emerald-500/10 text-emerald-400', closed: 'bg-neutral-500/10 text-[var(--text-secondary)]',
};
const brl = (cents: number) => `R$ ${((cents || 0) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
type Tab = 'overview' | 'activation' | 'tickets' | 'usage' | 'plans';

export default function Backoffice() {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [isSuper, setIsSuper] = useState(false);
  const [tab, setTab] = useState<Tab>('overview');
  const [data, setData] = useState<{ tenants: any[]; plans: any[]; finance: any } | null>(null);
  const [tickets, setTickets] = useState<db.Ticket[]>([]);
  const [usage, setUsage] = useState<Record<string, Record<string, number>>>({});
  const [act, setAct] = useState<any | null>(null);
  const [impersonate, setImpersonate] = useState<any | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); if (!data.session) setChecking(false); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { setSession(s); if (!s) { setIsSuper(false); setChecking(false); } });
    return () => sub.subscription.unsubscribe();
  }, []);

  const reload = async () => {
    try {
      const [bo, tk, us, ac] = await Promise.all([db.fetchBackoffice(), db.fetchTickets(), db.fetchUsageThisMonth(), db.fetchActivation()]);
      setData(bo); setTickets(tk); setUsage(us); setAct(ac);
    } catch (e) { console.error(e); }
  };

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
  const setTenantStatus = async (id: string, status: string) => { await db.updateTenantFields(id, status === 'active' ? { status, past_due_since: null } : { status }); reload(); };
  const setTenantPlan = async (id: string, planId: string) => { await db.updateTenantFields(id, { plan_id: planId }); reload(); };

  if (checking) return <div className="min-h-screen grid place-items-center bg-[var(--bg-app)] text-white"><p className="text-xs text-[var(--text-secondary)] animate-pulse">Carregando backoffice…</p></div>;
  if (!session) return <Login />;
  if (!isSuper) return (
    <div className="min-h-screen grid place-items-center bg-[var(--bg-app)] text-white px-4">
      <div className="text-center max-w-sm">
        <ShieldAlert size={32} className="mx-auto text-red-500" />
        <h1 className="mt-3 text-lg font-bold">Acesso restrito</h1>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">Área exclusiva para super-administradores da Iron Security.</p>
        <button onClick={logout} className="mt-5 text-xs font-semibold px-4 py-2 rounded-lg border border-[var(--border-mid)] hover:bg-[var(--bg-card-hover)]">Sair</button>
      </div>
    </div>
  );

  const f = data?.finance; const tenants = data?.tenants || []; const plans = data?.plans || [];

  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] font-sans">
      <header className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-soft)]">
        <div className="flex items-center gap-3">
          <Logo showText size="sm" className="text-white" />
          <span className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] border border-[var(--border-soft)] px-2 py-0.5 rounded">Backoffice</span>
        </div>
        <button onClick={logout} className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-white"><LogOut size={14} /> Sair</button>
      </header>

      <div className="max-w-6xl mx-auto px-6 pt-6">
        <div className="flex gap-2 text-xs flex-wrap">
          {([['overview', 'Visão geral'], ['activation', 'Ativação'], ['tickets', 'Chamados'], ['usage', 'Consumo'], ['plans', 'Planos']] as [Tab, string][]).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg font-semibold ${tab === t ? 'bg-[var(--bg-card-hover)] text-white border border-[var(--border-mid)]' : 'text-[var(--text-secondary)] hover:text-white'}`}>
              {label}{t === 'tickets' && tickets.filter(x => x.status === 'open').length > 0 ? ` (${tickets.filter(x => x.status === 'open').length})` : ''}
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
              <Kpi icon={<Layers size={14} />} label="Clientes" value={String(f?.customers ?? 0)} />
              <Kpi icon={<AlertTriangle size={14} />} label="Suspensos" value={String(f?.suspended || 0)} accent="red" />
            </div>

            <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border-soft)] overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--border-soft)] text-sm font-semibold">Clientes (Tenants)</div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="text-[var(--text-muted)] text-[10px] uppercase tracking-wider">
                    <tr className="border-b border-[var(--border-soft)]">
                      <th className="text-left px-4 py-2">Tenant</th><th className="text-left px-4 py-2">Status</th><th className="text-left px-4 py-2">Plano</th>
                      <th className="text-left px-4 py-2">Responsável</th><th className="text-right px-4 py-2">Users</th><th className="text-right px-4 py-2">Empr.</th>
                      <th className="text-right px-4 py-2">Lançam.</th><th className="text-right px-4 py-2">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenants.map(t => (
                      <tr key={t.id} className="border-b border-[var(--border-soft)] hover:bg-[var(--bg-card-hover)]">
                        <td className="px-4 py-2.5 font-semibold">{t.name}{t.internal && <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] uppercase bg-neutral-500/15 text-[var(--text-secondary)]">interno</span>}</td>
                        <td className="px-4 py-2.5"><span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${STATUS_STYLE[t.status] || ''}`}>{t.status}</span></td>
                        <td className="px-4 py-2.5">
                          <select value={t.planId || ''} onChange={e => setTenantPlan(t.id, e.target.value)} className="bg-[var(--bg-input)] border border-[var(--border-soft)] rounded px-2 py-1 text-[11px]">
                            {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-2.5 text-[var(--text-secondary)]">{t.owner?.email || '—'}</td>
                        <td className="px-4 py-2.5 text-right">{t.userCount}</td>
                        <td className="px-4 py-2.5 text-right">{t.companyCount}</td>
                        <td className="px-4 py-2.5 text-right">{t.txCount}</td>
                        <td className="px-4 py-2.5 text-right whitespace-nowrap">
                          <button onClick={() => setImpersonate(t)} title="Ver dados (read-only, auditado)" className="text-[10px] font-semibold px-2 py-1 rounded bg-[#1f2937]/40 text-blue-300 hover:bg-[#1f2937]/70 mr-1"><Eye size={11} className="inline" /> Ver</button>
                          {['active', 'trialing', 'past_due'].includes(t.status)
                            ? <button onClick={() => setTenantStatus(t.id, 'suspended')} className="text-[10px] font-semibold px-2 py-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20">Suspender</button>
                            : <button onClick={() => setTenantStatus(t.id, 'active')} className="text-[10px] font-semibold px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20">Reativar</button>}
                        </td>
                      </tr>
                    ))}
                    {tenants.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-[var(--text-muted)]">Nenhum tenant.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {tab === 'activation' && <ActivationPanel a={act} />}
        {tab === 'tickets' && <TicketsPanel tickets={tickets} onChanged={reload} />}
        {tab === 'usage' && <UsagePanel tenants={tenants} usage={usage} />}
        {tab === 'plans' && <PlansEditor plans={plans} onSaved={reload} />}
      </main>

      {impersonate && <ImpersonationModal tenant={impersonate} onClose={() => setImpersonate(null)} />}
    </div>
  );
}

function Kpi({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: string }) {
  const color = accent === 'emerald' ? 'text-emerald-400' : accent === 'amber' ? 'text-amber-400' : accent === 'red' ? 'text-red-400' : 'text-white';
  return (
    <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-soft)]">
      <div className="flex items-center gap-2 text-[var(--text-secondary)] text-[11px]">{icon} {label}</div>
      <p className={`text-xl font-extrabold mt-1 ${color}`}>{value}</p>
    </div>
  );
}

// ---- Ativação / Conversão (Fase 0) ----
function ActivationPanel({ a }: { a: any }) {
  if (!a) return <p className="text-xs text-[var(--text-secondary)]">Carregando…</p>;
  const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : 0);
  const steps = [
    { label: 'Clientes (signups)', value: a.customers, of: a.customers },
    { label: 'Importaram (IA)', value: a.imported, of: a.customers },
    { label: 'Conciliaram', value: a.reconciled, of: a.customers },
    { label: 'Ativados (importou + conciliou)', value: a.activated, of: a.customers },
    { label: 'Pagantes', value: a.paying, of: a.customers },
  ];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi icon={<Activity size={14} />} label="Ativação" value={`${pct(a.activated, a.customers)}%`} accent="emerald" />
        <Kpi icon={<Activity size={14} />} label="Importou → Conciliou" value={`${pct(a.reconciled, a.imported || 1)}%`} />
        <Kpi icon={<DollarSign size={14} />} label="Conversão paga" value={`${pct(a.paying, a.customers)}%`} accent="emerald" />
        <Kpi icon={<Users size={14} />} label="Clientes" value={String(a.customers)} />
      </div>
      <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border-soft)] p-4">
        <p className="text-sm font-semibold mb-3">Funil do workflow matador</p>
        <div className="space-y-2">
          {steps.map(s => (
            <div key={s.label}>
              <div className="flex justify-between text-xs mb-1"><span className="text-[var(--text-secondary)]">{s.label}</span><span className="font-semibold">{s.value} ({pct(s.value, s.of)}%)</span></div>
              <div className="h-2 rounded bg-[var(--bg-input)] overflow-hidden"><div className="h-full bg-emerald-500/70" style={{ width: `${pct(s.value, s.of)}%` }} /></div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-[var(--text-muted)] mt-3">Meta Fase 0: ≥40% ativados, ≥30% topam o preço-alvo. Ativação = importou (IA) e conciliou ≥1 lançamento.</p>
      </div>
    </div>
  );
}

// ---- Chamados ----
function TicketsPanel({ tickets, onChanged }: { tickets: db.Ticket[]; onChanged: () => void }) {
  const [sel, setSel] = useState<db.Ticket | null>(null);
  const [msgs, setMsgs] = useState<any[]>([]);
  const [reply, setReply] = useState('');
  const [internal, setInternal] = useState(false);

  const open = async (t: db.Ticket) => { setSel(t); setMsgs(await db.fetchTicketMessages(t.id)); };
  const send = async () => {
    if (!sel || !reply.trim()) return;
    await db.addTicketMessage(sel.id, sel.tenantId, reply.trim(), internal);
    setReply(''); setMsgs(await db.fetchTicketMessages(sel.id));
  };
  const setStatus = async (s: string) => { if (!sel) return; await db.updateTicketStatus(sel.id, s); onChanged(); setSel({ ...sel, status: s }); };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border-soft)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border-soft)] text-sm font-semibold flex items-center gap-2"><MessageSquare size={14} /> Chamados</div>
        <div className="divide-y divide-[var(--border-soft)] max-h-[60vh] overflow-y-auto">
          {tickets.map(t => (
            <button key={t.id} onClick={() => open(t)} className={`w-full text-left px-4 py-3 hover:bg-[var(--bg-card-hover)] ${sel?.id === t.id ? 'bg-[var(--bg-card-hover)]' : ''}`}>
              <div className="flex justify-between gap-2"><span className="text-xs font-semibold truncate">{t.subject}</span><span className={`px-1.5 py-0.5 rounded text-[9px] ${STATUS_STYLE[t.status] || ''}`}>{t.status}</span></div>
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{t.tenantName || '—'}</p>
            </button>
          ))}
          {tickets.length === 0 && <p className="px-4 py-8 text-center text-xs text-[var(--text-muted)]">Nenhum chamado.</p>}
        </div>
      </div>

      <div className="lg:col-span-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-soft)]">
        {!sel ? <p className="p-8 text-center text-xs text-[var(--text-muted)]">Selecione um chamado.</p> : (
          <div className="flex flex-col h-full">
            <div className="px-4 py-3 border-b border-[var(--border-soft)] flex items-center justify-between">
              <div><p className="text-sm font-semibold">{sel.subject}</p><p className="text-[10px] text-[var(--text-muted)]">{sel.tenantName}</p></div>
              <select value={sel.status} onChange={e => setStatus(e.target.value)} className="bg-[var(--bg-input)] border border-[var(--border-soft)] rounded px-2 py-1 text-[11px]">
                {['open', 'pending', 'resolved', 'closed'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="p-4 space-y-3 max-h-[45vh] overflow-y-auto">
              {msgs.map(m => (
                <div key={m.id} className={`text-xs p-2.5 rounded-lg border ${m.internal ? 'bg-amber-500/5 border-amber-500/20' : 'bg-[var(--bg-card-hover)] border-[var(--border-soft)]'}`}>
                  {m.internal && <span className="text-[9px] uppercase text-amber-400 font-bold">nota interna</span>}
                  <p className="text-[var(--text-primary)] whitespace-pre-wrap">{m.body}</p>
                  <p className="text-[9px] text-[var(--text-muted)] mt-1">{new Date(m.createdAt).toLocaleString('pt-BR')}</p>
                </div>
              ))}
              {msgs.length === 0 && <p className="text-xs text-[var(--text-muted)]">Sem mensagens.</p>}
            </div>
            <div className="p-3 border-t border-[var(--border-soft)] space-y-2">
              <textarea value={reply} onChange={e => setReply(e.target.value)} placeholder="Responder…" rows={2}
                className="w-full bg-[var(--bg-input)] border border-[var(--border-soft)] rounded-lg px-3 py-2 text-xs outline-none" />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)]"><input type="checkbox" checked={internal} onChange={e => setInternal(e.target.checked)} /> Nota interna</label>
                <button onClick={send} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[var(--text-primary)] text-[var(--bg-app)] hover:bg-white">Enviar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Consumo ----
function UsagePanel({ tenants, usage }: { tenants: any[]; usage: Record<string, Record<string, number>> }) {
  const cell = (used: number, limit: number) => {
    const over = limit >= 0 && used > limit;
    return <span className={over ? 'text-red-400 font-bold' : ''}>{used}{limit >= 0 ? ` / ${limit}` : ' / ∞'}</span>;
  };
  return (
    <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border-soft)] overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border-soft)] text-sm font-semibold flex items-center gap-2"><Activity size={14} /> Consumo do mês</div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="text-[var(--text-muted)] text-[10px] uppercase tracking-wider">
            <tr className="border-b border-[var(--border-soft)]"><th className="text-left px-4 py-2">Tenant</th><th className="text-left px-4 py-2">Plano</th><th className="text-right px-4 py-2">Transações</th><th className="text-right px-4 py-2">Importações IA</th></tr>
          </thead>
          <tbody>
            {tenants.filter(t => !t.internal).map(t => {
              const u = usage[t.id] || {}; const lim = t.plan?.limits || {};
              return (
                <tr key={t.id} className="border-b border-[var(--border-soft)]">
                  <td className="px-4 py-2.5 font-semibold">{t.name}</td>
                  <td className="px-4 py-2.5 text-[var(--text-secondary)]">{t.plan?.name || '—'}</td>
                  <td className="px-4 py-2.5 text-right">{cell(u.transaction || 0, lim.transactions_month ?? -1)}</td>
                  <td className="px-4 py-2.5 text-right">{cell(u.ai_import || 0, lim.ai_imports_month ?? -1)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="px-4 py-2 text-[10px] text-[var(--text-muted)]">Vermelho = acima do limite do plano. ∞ = ilimitado.</p>
    </div>
  );
}

// ---- Impersonação read-only (auditada) ----
function ImpersonationModal({ tenant, onClose }: { tenant: any; onClose: () => void }) {
  const [snap, setSnap] = useState<any | null>(null);
  useEffect(() => {
    db.logImpersonation(tenant.id, 'backoffice read-only view');
    db.fetchTenantSnapshot(tenant.id).then(setSnap);
  }, [tenant.id]);
  return (
    <div className="fixed inset-0 z-50 bg-black/70 grid place-items-center p-4" onClick={onClose}>
      <div className="w-full max-w-3xl max-h-[85vh] overflow-y-auto bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-2xl" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-[var(--border-soft)] flex items-center justify-between sticky top-0 bg-[var(--bg-card)]">
          <div><p className="text-sm font-bold">{tenant.name}</p><p className="text-[10px] text-[var(--text-muted)]">Visão read-only (acesso auditado)</p></div>
          <button onClick={onClose}><X size={18} className="text-[var(--text-secondary)] hover:text-white" /></button>
        </div>
        {!snap ? <p className="p-8 text-center text-xs text-[var(--text-muted)]">Carregando…</p> : (
          <div className="p-5 space-y-5 text-xs">
            <Section title={`Empresas (${snap.companies.length})`}>{snap.companies.map((c: any) => <React.Fragment key={c.cnpj}><Row a={c.nomeFantasia || c.razaoSocial} b={c.cnpj} /></React.Fragment>)}</Section>
            <Section title={`Usuários (${snap.users.length})`}>{snap.users.map((u: any) => <React.Fragment key={u.id}><Row a={u.name || u.email} b={`${u.email} · ${u.role}`} /></React.Fragment>)}</Section>
            <Section title={`Contas (${snap.accounts.length})`}>{snap.accounts.map((a: any) => <React.Fragment key={a.id}><Row a={a.name} b={brl((a.balance || 0) * 100)} /></React.Fragment>)}</Section>
            <Section title={`Lançamentos recentes (${snap.transactions.length})`}>{snap.transactions.map((t: any) => <React.Fragment key={t.id}><Row a={t.description} b={`${t.date} · ${brl((t.value || 0) * 100)}`} /></React.Fragment>)}</Section>
          </div>
        )}
      </div>
    </div>
  );
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1.5">{title}</p><div className="space-y-1">{children}</div></div>;
}
function Row({ a, b }: { a: string; b: string }) {
  return <div className="flex justify-between gap-3 px-3 py-1.5 rounded bg-[var(--bg-card-hover)] border border-[var(--border-soft)]"><span className="truncate">{a}</span><span className="text-[var(--text-secondary)] shrink-0">{b}</span></div>;
}

// ---- Planos ----
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
      await db.savePlan({ id: p.id, code: p.code, name: get(p, 'name'),
        price_cents: Math.round(Number(draft[p.code]?.price_reais ?? (p.price_cents / 100)) * 100),
        limits: { ...p.limits, ...(draft[p.code]?.limits || {}) }, active: draft[p.code]?.active ?? p.active });
      await onSaved(); setDraft(d => { const n = { ...d }; delete n[p.code]; return n; });
    } catch (e: any) { alert('Falha ao salvar: ' + (e?.message || e)); }
    setSaving('');
  };
  return (
    <div className="space-y-4">
      {plans.map(p => (
        <div key={p.id} className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-soft)]">
          <div className="flex flex-wrap items-end gap-4">
            <div><label className="text-[10px] uppercase text-[var(--text-muted)]">Código</label><p className="text-sm font-bold">{p.code}</p></div>
            <Inp label="Nome" value={get(p, 'name')} onChange={(v: string) => set(p.code, { name: v })} />
            <Inp label="Preço (R$/mês)" type="number" value={String(draft[p.code]?.price_reais ?? (p.price_cents / 100))} onChange={(v: string) => set(p.code, { price_reais: v })} />
            {limitKeys.map(k => <React.Fragment key={k}><Inp label={k} type="number" w="w-24" value={String(getLimit(p, k))} onChange={(v: string) => setLim(p, k, v)} /></React.Fragment>)}
            <label className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]"><input type="checkbox" checked={draft[p.code]?.active ?? p.active} onChange={e => set(p.code, { active: e.target.checked })} /> Ativo</label>
            <button onClick={() => save(p)} disabled={saving === p.code} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-[var(--text-primary)] text-[var(--bg-app)] hover:bg-white disabled:opacity-50"><Save size={13} /> {saving === p.code ? 'Salvando…' : 'Salvar'}</button>
          </div>
          <p className="text-[10px] text-[var(--text-muted)] mt-2">Limites: -1 = ilimitado.</p>
        </div>
      ))}
      <p className="text-[11px] text-[var(--text-muted)] flex items-center gap-1"><Plus size={12} /> Para criar um novo tier, me peça (precisa de um novo `code`); ou edite os existentes acima.</p>
    </div>
  );
}
function Inp({ label, value, onChange, type = 'text', w = 'w-40' }: { label: string; value: string; onChange: (v: string) => void; type?: string; w?: string }) {
  return (
    <div><label className="text-[10px] uppercase text-[var(--text-muted)] block">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} className={`${w} bg-[var(--bg-input)] border border-[var(--border-soft)] rounded px-2 py-1.5 text-xs mt-0.5`} /></div>
  );
}
