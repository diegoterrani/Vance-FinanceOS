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
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5] font-sans">
      {/* Nav */}
      <header className="flex items-center justify-between px-6 sm:px-10 py-5 border-b border-[#1c1c1c]">
        <Logo showText size="md" className="text-white" />
        <a href={APP_URL} className="text-xs font-semibold px-4 py-2 rounded-lg border border-[#2a2a2a] hover:bg-[#1a1a1a] transition-all">
          Entrar
        </a>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 text-center pt-20 pb-16">
        <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-[#A3A3A3] bg-[#141414] border border-[#222] px-3 py-1 rounded-full">
          <Sparkles size={11} className="text-yellow-500" /> Plataforma financeira inteligente para PJ
        </span>
        <h1 className="mt-6 text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.05]">
          Tesouraria corporativa <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A3A3A3] via-white to-[#7a7a7a]">automatizada</span>.
        </h1>
        <p className="mt-5 text-sm sm:text-base text-[#A3A3A3] max-w-2xl mx-auto leading-relaxed">
          Gestão de caixa, conciliação e emissão de notas para múltiplas empresas — com integrações bancárias e de ERP via API REST e importação de documentos por IA.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <a href={`${APP_URL}/signup`} className="inline-flex items-center gap-1.5 bg-[#F5F5F5] text-[#0A0A0A] font-semibold text-sm px-5 py-3 rounded-lg hover:bg-white transition-all">
            Começar trial de 14 dias <ArrowRight size={15} />
          </a>
          <a href="#planos" className="text-sm font-semibold px-5 py-3 rounded-lg border border-[#2a2a2a] hover:bg-[#1a1a1a] transition-all">Ver planos</a>
        </div>
        <p className="mt-3 text-[11px] text-[#737373]">Sem cartão de crédito. Cancele quando quiser.</p>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 gap-4 pb-16">
        {features.map(f => (
          <div key={f.title} className="flex gap-3 p-5 rounded-xl bg-[#0E0E0E] border border-[#1c1c1c]">
            <div className="w-9 h-9 rounded-lg bg-[#151515] border border-[#262626] grid place-items-center text-white shrink-0">
              <f.icon size={17} />
            </div>
            <div>
              <p className="text-sm font-semibold">{f.title}</p>
              <p className="text-xs text-[#A3A3A3] mt-1 leading-relaxed">{f.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Pricing */}
      <section id="planos" className="max-w-5xl mx-auto px-6 pb-24">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-center tracking-tight">Planos</h2>
        <p className="text-center text-xs text-[#A3A3A3] mt-2">Comece com 14 dias grátis. Faça upgrade quando precisar.</p>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((p, i) => (
            <div key={p.code} className={`p-6 rounded-2xl border ${i === 1 ? 'border-white/30 bg-[#121212]' : 'border-[#1c1c1c] bg-[#0E0E0E]'}`}>
              {i === 1 && <span className="text-[9px] uppercase tracking-widest text-yellow-500 font-bold">Mais popular</span>}
              <h3 className="text-lg font-bold mt-1">{p.name}</h3>
              <p className="mt-3">
                <span className="text-3xl font-extrabold">R$ {(p.price_cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</span>
                <span className="text-xs text-[#737373]">/mês</span>
              </p>
              <ul className="mt-5 space-y-2">
                {Object.entries(p.limits || {}).map(([k, v]) => (
                  LIMIT_LABELS[k] ? (
                    <li key={k} className="flex items-center gap-2 text-xs text-[#cfcfcf]">
                      <Check size={13} className="text-emerald-500 shrink-0" /> {LIMIT_LABELS[k](v as number)}
                    </li>
                  ) : null
                ))}
              </ul>
              <a href={`${APP_URL}/signup?plan=${p.code}`} className={`mt-6 block text-center text-sm font-semibold px-4 py-2.5 rounded-lg transition-all ${i === 1 ? 'bg-[#F5F5F5] text-[#0A0A0A] hover:bg-white' : 'border border-[#2a2a2a] hover:bg-[#1a1a1a]'}`}>
                Começar
              </a>
            </div>
          ))}
          {plans.length === 0 && <p className="col-span-3 text-center text-xs text-[#737373]">Carregando planos…</p>}
        </div>
      </section>

      <footer className="border-t border-[#1c1c1c] py-8 text-center text-[11px] text-[#737373]">
        © {new Date().getFullYear()} Vance Expert · Iron Security
      </footer>
    </div>
  );
}
