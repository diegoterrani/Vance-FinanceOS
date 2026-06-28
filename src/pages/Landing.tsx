import React, { useEffect, useState } from 'react';
import { Check, ArrowRight, ShieldCheck, TrendingUp, Wallet, Sparkles } from 'lucide-react';
import Logo from '../components/Logo';
import { supabase } from '../lib/supabase';
import { APP_URL } from '../lib/hostShell';

interface Plan { code: string; name: string; price_cents: number; limits: any; }

const LIMIT_LABELS: Record<string, (v: number) => string> = {
  companies: v => (v < 0 ? 'Empresas ilimitadas' : `${v} empresa(s)`),
  users: v => (v < 0 ? 'Usuários ilimitados' : `${v} usuários`),
  transactions_month: v => (v < 0 ? 'Transações ilimitadas' : `${v.toLocaleString('pt-BR')} transações/mês`),
  ai_imports_month: v => (v < 0 ? 'Importações IA ilimitadas' : `${v} importações IA/mês`),
};

export default function Landing() {
  const [plans, setPlans] = useState<Plan[]>([]);

  useEffect(() => {
    supabase.from('plans').select('code,name,price_cents,limits').eq('active', true).order('price_cents')
      .then(({ data }) => setPlans((data as any) || []));
  }, []);

  const features = [
    { icon: ShieldCheck, title: 'Multiempresa e seguro', desc: 'Isolamento total entre clientes (multi-tenant) e trilha de auditoria.' },
    { icon: TrendingUp, title: 'Fluxo de caixa e conciliação', desc: 'Previsões, conciliação bancária e indicadores em tempo real.' },
    { icon: Wallet, title: 'Integrações via API REST', desc: 'Bancos PJ (Itaú, BB, C6, Caixa, XP, Genial…) e ERPs por API REST.' },
    { icon: Sparkles, title: 'Importação por IA', desc: 'Boletos e notas fiscais lidos automaticamente e lançados.' },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] font-sans">
      {/* Nav */}
      <header className="flex items-center justify-between px-6 sm:px-10 py-5 border-b border-[var(--border-soft)]">
        <Logo showText size="md" className="text-white" />
        <a href={APP_URL} className="text-xs font-semibold px-4 py-2 rounded-lg border border-[var(--border-mid)] hover:bg-[var(--bg-card-hover)] transition-all">
          Entrar
        </a>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 text-center pt-20 pb-16">
        <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-[var(--text-secondary)] bg-[var(--bg-card-hover)] border border-[var(--border-soft)] px-3 py-1 rounded-full">
          <Sparkles size={11} className="text-yellow-500" /> Plataforma financeira inteligente para PJ
        </span>
        <h1 className="mt-6 text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.05]">
          Tesouraria corporativa <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--text-secondary)] via-white to-[var(--text-muted)]">automatizada</span>.
        </h1>
        <p className="mt-5 text-sm sm:text-base text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
          Gestão de caixa, conciliação e emissão de notas para múltiplas empresas — com integrações bancárias e de ERP via API REST e importação de documentos por IA.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <a href={`${APP_URL}/signup`} className="inline-flex items-center gap-1.5 bg-[var(--text-primary)] text-[var(--bg-app)] font-semibold text-sm px-5 py-3 rounded-lg hover:bg-white transition-all">
            Começar trial de 14 dias <ArrowRight size={15} />
          </a>
          <a href="#planos" className="text-sm font-semibold px-5 py-3 rounded-lg border border-[var(--border-mid)] hover:bg-[var(--bg-card-hover)] transition-all">Ver planos</a>
        </div>
        <p className="mt-3 text-[11px] text-[var(--text-muted)]">Sem cartão de crédito. Cancele quando quiser.</p>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 gap-4 pb-16">
        {features.map(f => (
          <div key={f.title} className="flex gap-3 p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-soft)]">
            <div className="w-9 h-9 rounded-lg bg-[var(--bg-card-hover)] border border-[var(--border-mid)] grid place-items-center text-white shrink-0">
              <f.icon size={17} />
            </div>
            <div>
              <p className="text-sm font-semibold">{f.title}</p>
              <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">{f.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Pricing */}
      <section id="planos" className="max-w-5xl mx-auto px-6 pb-24">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-center tracking-tight">Planos</h2>
        <p className="text-center text-xs text-[var(--text-secondary)] mt-2">Comece com 14 dias grátis. Faça upgrade quando precisar.</p>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((p, i) => (
            <div key={p.code} className={`p-6 rounded-2xl border ${i === 1 ? 'border-[var(--border-mid)] bg-[var(--bg-card)]' : 'border-[var(--border-soft)] bg-[var(--bg-card)]'}`}>
              {i === 1 && <span className="text-[9px] uppercase tracking-widest text-yellow-500 font-bold">Mais popular</span>}
              <h3 className="text-lg font-bold mt-1">{p.name}</h3>
              <p className="mt-3">
                <span className="text-3xl font-extrabold">R$ {(p.price_cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</span>
                <span className="text-xs text-[var(--text-muted)]">/mês</span>
              </p>
              <ul className="mt-5 space-y-2">
                {Object.entries(p.limits || {}).map(([k, v]) => (
                  LIMIT_LABELS[k] ? (
                    <li key={k} className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                      <Check size={13} className="text-emerald-500 shrink-0" /> {LIMIT_LABELS[k](v as number)}
                    </li>
                  ) : null
                ))}
              </ul>
              <a href={`${APP_URL}/signup?plan=${p.code}`} className={`mt-6 block text-center text-sm font-semibold px-4 py-2.5 rounded-lg transition-all ${i === 1 ? 'bg-[var(--text-primary)] text-[var(--bg-app)] hover:bg-white' : 'border border-[var(--border-mid)] hover:bg-[var(--bg-card-hover)]'}`}>
                Começar
              </a>
            </div>
          ))}
          {plans.length === 0 && <p className="col-span-3 text-center text-xs text-[var(--text-muted)]">Carregando planos…</p>}
        </div>
      </section>

      <footer className="border-t border-[var(--border-soft)] py-8 text-center text-[11px] text-[var(--text-muted)]">
        © {new Date().getFullYear()} Vance Expert · Iron Security
      </footer>
    </div>
  );
}
