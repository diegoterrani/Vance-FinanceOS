import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Mail, Lock, User as UserIcon, Building2, ArrowRight, AlertCircle, Check } from 'lucide-react';
import Logo from '../components/Logo';
import { supabase } from '../lib/supabase';

const PLAN_LABEL: Record<string, string> = { starter: 'Starter', pro: 'Pro', enterprise: 'Enterprise' };

export default function Signup() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const plan = (params.get('plan') || 'starter').toLowerCase();

  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  // If already authenticated, go straight to the app.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) navigate('/'); });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setInfo('');
    if (!name) return setError('Informe seu nome.');
    if (!companyName) return setError('Informe o nome da empresa.');
    if (!email) return setError('Informe um e-mail válido.');
    if (password.length < 6) return setError('A senha deve ter no mínimo 6 caracteres.');

    setLoading(true);
    try {
      // 1) try server-side auto-confirmed signup (instant trial)
      const resp = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, companyName, plan }),
      });
      const j = await resp.json().catch(() => ({}));

      if (resp.status === 409) { setError('Este e-mail já está em uso.'); setLoading(false); return; }

      if (resp.ok && j.autoConfirmed) {
        const { error } = await supabase.auth.signInWithPassword({ email: email.toLowerCase(), password });
        setLoading(false);
        if (error) { setError('Conta criada. Faça login para continuar.'); return; }
        navigate('/');
        return;
      }

      // 2) fallback: client signup (may require email confirmation)
      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase(),
        password,
        options: { data: { name, company_name: companyName, plan } },
      });
      setLoading(false);
      if (error) {
        setError(error.message.toLowerCase().includes('already') ? 'Este e-mail já está em uso.' : error.message);
        return;
      }
      if (data.session) navigate('/');
      else setInfo('Conta criada! Verifique seu e-mail para confirmar o acesso e então faça login.');
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || 'Falha no cadastro.');
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-[var(--bg-app)] text-[var(--text-primary)] font-sans px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8"><Logo showText size="md" className="text-white" /></div>
        <div className="bg-[var(--bg-card)] p-6 sm:p-8 rounded-2xl border border-[var(--border-soft)] shadow-2xl">
          <div className="text-center mb-6">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Criar conta</h1>
            <p className="text-[var(--text-secondary)] text-xs mt-1.5">
              Plano <strong className="text-white">{PLAN_LABEL[plan] || 'Starter'}</strong> · 14 dias grátis, sem cartão.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-950/50 border border-red-900/50 text-red-400 text-xs flex gap-2 items-start">
              <AlertCircle size={15} className="mt-0.5 shrink-0" /><span>{error}</span>
            </div>
          )}
          {info && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-950/40 border border-emerald-900/50 text-emerald-400 text-xs flex gap-2 items-start">
              <Check size={15} className="mt-0.5 shrink-0" /><span>{info}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <Field icon={<UserIcon size={14} />} placeholder="Seu nome completo" value={name} onChange={setName} disabled={loading} />
            <Field icon={<Building2 size={14} />} placeholder="Nome da empresa" value={companyName} onChange={setCompanyName} disabled={loading} />
            <Field icon={<Mail size={14} />} type="email" placeholder="E-mail corporativo" value={email} onChange={setEmail} disabled={loading} />
            <Field icon={<Lock size={14} />} type="password" placeholder="Senha (mín. 6 caracteres)" value={password} onChange={setPassword} disabled={loading} />
            <button type="submit" disabled={loading}
              className="w-full bg-[var(--text-primary)] hover:bg-white text-[var(--bg-app)] font-medium text-xs py-2.5 rounded-lg flex items-center justify-center gap-1.5 mt-2 disabled:opacity-50">
              {loading ? 'Criando conta...' : 'Começar trial de 14 dias'} <ArrowRight size={13} />
            </button>
          </form>

          <p className="mt-6 pt-5 border-t border-[var(--border-soft)] text-center text-xs text-[var(--text-muted)]">
            Já tem conta? <Link to="/" className="text-[var(--text-secondary)] font-semibold hover:text-white">Fazer login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ icon, placeholder, value, onChange, type = 'text', disabled }: {
  icon: React.ReactNode; placeholder: string; value: string; onChange: (v: string) => void; type?: string; disabled?: boolean;
}) {
  return (
    <div className="relative">
      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--text-muted)]">{icon}</span>
      <input
        type={type} placeholder={placeholder} value={value} disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[var(--bg-input)] text-white border border-[var(--border-soft)] focus:border-[var(--border-strong)] rounded-lg text-xs py-2.5 pl-9 pr-4 outline-none transition-all"
      />
    </div>
  );
}
