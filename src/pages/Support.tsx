import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Send, MessageSquare } from 'lucide-react';
import Logo from '../components/Logo';
import { supabase } from '../lib/supabase';
import * as db from '../lib/db';

const STATUS_STYLE: Record<string, string> = {
  open: 'bg-blue-500/10 text-blue-400', pending: 'bg-amber-500/10 text-amber-400',
  resolved: 'bg-emerald-500/10 text-emerald-400', closed: 'bg-neutral-500/10 text-neutral-400',
};

export default function Support() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [tickets, setTickets] = useState<db.Ticket[]>([]);
  const [sel, setSel] = useState<db.Ticket | null>(null);
  const [msgs, setMsgs] = useState<any[]>([]);
  const [reply, setReply] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { navigate('/'); return; }
      setTickets(await db.fetchTickets());
      setReady(true);
    });
  }, [navigate]);

  const refresh = async () => setTickets(await db.fetchTickets());
  const open = async (t: db.Ticket) => { setSel(t); setMsgs(await db.fetchTicketMessages(t.id)); };

  const create = async () => {
    if (!newSubject.trim()) return;
    setCreating(true);
    try { const t = await db.createTicket(newSubject.trim()); setNewSubject(''); await refresh(); open(t); }
    catch (e: any) { alert('Falha ao abrir chamado: ' + (e?.message || e)); }
    setCreating(false);
  };
  const send = async () => {
    if (!sel || !reply.trim()) return;
    await db.addTicketMessage(sel.id, sel.tenantId, reply.trim(), false);
    setReply(''); setMsgs(await db.fetchTicketMessages(sel.id));
  };

  if (!ready) return <div className="min-h-screen grid place-items-center bg-[#0A0F1A] text-white"><p className="text-xs text-[#A3A3A3] animate-pulse">Carregando…</p></div>;

  return (
    <div className="min-h-screen bg-[#0A0F1A] text-[#F5F5F5] font-sans">
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <Logo showText size="sm" className="text-white" />
        <a href="/" className="flex items-center gap-1.5 text-xs text-[#A3A3A3] hover:text-white"><ArrowLeft size={14} /> Voltar ao app</a>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-xs font-semibold mb-2">Abrir chamado</p>
            <input value={newSubject} onChange={e => setNewSubject(e.target.value)} placeholder="Assunto do chamado"
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs outline-none" />
            <button onClick={create} disabled={creating} className="mt-2 w-full flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-[#F5F5F5] text-[#0A0A0A] hover:bg-white disabled:opacity-50">
              <Plus size={13} /> {creating ? 'Abrindo…' : 'Novo chamado'}
            </button>
          </div>
          <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-white/10 text-xs font-semibold flex items-center gap-1.5"><MessageSquare size={13} /> Meus chamados</div>
            <div className="divide-y divide-white/5 max-h-[55vh] overflow-y-auto">
              {tickets.map(t => (
                <button key={t.id} onClick={() => open(t)} className={`w-full text-left px-4 py-3 hover:bg-white/5 ${sel?.id === t.id ? 'bg-white/5' : ''}`}>
                  <div className="flex justify-between gap-2"><span className="text-xs font-semibold truncate">{t.subject}</span><span className={`px-1.5 py-0.5 rounded text-[9px] ${STATUS_STYLE[t.status] || ''}`}>{t.status}</span></div>
                </button>
              ))}
              {tickets.length === 0 && <p className="px-4 py-6 text-center text-xs text-[#737373]">Nenhum chamado ainda.</p>}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 rounded-xl bg-white/5 border border-white/10 min-h-[60vh] flex flex-col">
          {!sel ? <p className="m-auto text-xs text-[#737373]">Selecione ou abra um chamado.</p> : (
            <>
              <div className="px-4 py-3 border-b border-white/10"><p className="text-sm font-semibold">{sel.subject}</p><span className={`px-1.5 py-0.5 rounded text-[9px] ${STATUS_STYLE[sel.status] || ''}`}>{sel.status}</span></div>
              <div className="p-4 space-y-3 flex-1 overflow-y-auto">
                {msgs.map(m => (
                  <div key={m.id} className="text-xs p-2.5 rounded-lg bg-black/30 border border-white/10">
                    <p className="text-[#ddd] whitespace-pre-wrap">{m.body}</p>
                    <p className="text-[9px] text-[#737373] mt-1">{new Date(m.createdAt).toLocaleString('pt-BR')}</p>
                  </div>
                ))}
                {msgs.length === 0 && <p className="text-xs text-[#737373]">Descreva seu problema enviando a primeira mensagem.</p>}
              </div>
              {sel.status !== 'closed' && (
                <div className="p-3 border-t border-white/10 flex gap-2">
                  <input value={reply} onChange={e => setReply(e.target.value)} placeholder="Mensagem…" onKeyDown={e => e.key === 'Enter' && send()}
                    className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs outline-none" />
                  <button onClick={send} className="px-3 py-2 rounded-lg bg-[#F5F5F5] text-[#0A0A0A] hover:bg-white"><Send size={14} /></button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
