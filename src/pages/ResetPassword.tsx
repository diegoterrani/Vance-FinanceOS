import React, { useState } from 'react';
import { Lock, Check, AlertCircle, ArrowRight } from 'lucide-react';
import Logo from '../components/Logo';
import { supabase } from '../lib/supabase';

// Shown when the user arrives from a password-recovery email link
// (URL hash contains type=recovery). Supabase has already created a temporary
// session from the link, so updateUser can set the new password.
export default function ResetPassword({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!password || password.length < 6) return setError('A senha deve conter no mínimo 6 caracteres.');
    if (password !== confirm) return setError('As senhas não coincidem.');

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message.toLowerCase().includes('same') ? 'A nova senha deve ser diferente da anterior.' : error.message);
      return;
    }
    setSuccess(true);
    // Clean the recovery hash from the URL.
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', window.location.pathname);
    }
    setTimeout(onDone, 1200);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[var(--bg-app)] text-[var(--text-primary)] font-sans px-4">
      <div className="mb-8"><Logo showText={true} size="md" /></div>
      <div className="w-full max-w-md bg-[var(--bg-card)] p-6 sm:p-8 rounded-2xl border border-[var(--border-soft)] backdrop-blur-md shadow-2xl">
        <div className="text-center mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Definir nova senha</h2>
          <p className="text-[var(--text-secondary)] text-xs mt-1.5">Crie uma nova senha de acesso para sua conta.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-950/50 border border-red-900/50 text-red-400 text-xs flex gap-2 items-start">
            <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-900/50 text-emerald-400 text-xs flex gap-2 items-start">
            <Check size={15} className="mt-0.5 flex-shrink-0" />
            <span>Senha atualizada com sucesso! Redirecionando...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">Nova Senha</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--text-muted)]"><Lock size={14} /></span>
                <input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[var(--bg-input)] text-white border border-[var(--border-soft)] focus:border-[var(--border-strong)] rounded-lg text-xs py-2.5 pl-9 pr-4 transition-all outline-none"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">Confirmar Senha</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--text-muted)]"><Lock size={14} /></span>
                <input
                  type="password"
                  placeholder="Repita a nova senha"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full bg-[var(--bg-input)] text-white border border-[var(--border-soft)] focus:border-[var(--border-strong)] rounded-lg text-xs py-2.5 pl-9 pr-4 transition-all outline-none"
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--text-primary)] hover:bg-white text-[var(--bg-app)] font-medium text-xs py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 mt-2 cursor-pointer shadow-lg disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar nova senha'}
              <ArrowRight size={13} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
