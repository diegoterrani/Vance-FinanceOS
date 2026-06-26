import React, { useState } from 'react';
import { Mail, Lock, User as UserIcon, ArrowRight, ShieldCheck, Check, Sparkles, TrendingUp, Wallet, AlertCircle } from 'lucide-react';
import Logo from '../components/Logo';
import { User, UserRole } from '../types';

interface LoginProps {
  users: User[];
  onAddUser: (user: User) => void;
  onLogin: (user: User) => void;
}

export default function Login({ users, onAddUser, onLogin }: LoginProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('analista');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email) {
      setError('Por favor, informe seu e-mail.');
      return;
    }
    if (!password) {
      setError('Por favor, digite sua senha.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      // Find user by email (case-insensitive)
      const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (foundUser) {
        if (foundUser.status === 'inactive') {
          setError('Esta conta está atualmente desativada. Entre em contato com o suporte.');
          setLoading(false);
          return;
        }
        onLogin(foundUser);
      } else {
        // If not found in default list, create a transient user representing the custom login
        const newCustomUser: User = {
          id: `u-${Date.now()}`,
          name: email.split('@')[0].split('.').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          email: email.toLowerCase(),
          avatar: `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100`, // default abstract avatar
          role: 'analista', // default role
          status: 'active',
          lastActive: 'Agora mesmo',
          lastIp: '177.34.21.198',
          device: 'Navegador Web'
        };
        onAddUser(newCustomUser);
        onLogin(newCustomUser);
      }
      setLoading(false);
    }, 600);
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name) {
      setError('Por favor, digite seu nome completo.');
      return;
    }
    if (!email) {
      setError('Por favor, informe um e-mail válido.');
      return;
    }
    if (!password || password.length < 6) {
      setError('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      // Check if email already exists
      const emailExists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
      if (emailExists) {
        setError('Este e-mail já está em uso.');
        setLoading(false);
        return;
      }

      const newUser: User = {
        id: `u-${Date.now()}`,
        name,
        email: email.toLowerCase(),
        avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100`,
        role: role,
        status: 'active',
        lastActive: 'Agora mesmo',
        lastIp: '127.0.0.1',
        device: 'Dispositivo Recém Cadastrado'
      };

      onAddUser(newUser);
      onLogin(newUser);
      setLoading(false);
    }, 800);
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email) {
      setError('Por favor, insira o seu e-mail cadastrado.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setSuccessMsg('As instruções de recuperação foram enviadas para o e-mail informado.');
      setLoading(false);
    }, 1000);
  };

  return (
    <div id="auth-container" className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[#0A0A0A] text-[#F5F5F5] font-sans overflow-hidden">
      
      {/* LEFT PANEL: PRODUCT VALUE SUMMARY & DECORATIONS (Hidden on small / tablet screen formats) */}
      <div className="hidden lg:flex lg:col-span-5 p-12 flex-col justify-between relative bg-radial-gradient from-neutral-900 to-[#0A0A0A] border-r border-[#222222] select-none">
        
        {/* Abstract futuristic grid layout overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35" />
        
        <div className="relative z-10">
          <Logo showText={true} size="md" className="text-white" />
          
          <div className="mt-20 space-y-6 max-w-sm">
            <h1 className="text-3xl font-extrabold text-white leading-tight tracking-tight">
              Sua tesouraria <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A3A3A3] via-white to-[#555555]">automatizada</span> e em tempo real.
            </h1>
            <p className="text-xs text-[#A3A3A3] leading-relaxed">
              Conecte suas contas corporativas através do Open Finance de forma imediata e concilie milhares de transações automaticamente com IA Vance.
            </p>
          </div>
        </div>

        {/* Feature widgets showcasing system capabilities */}
        <div className="relative z-10 space-y-4 my-8 max-w-sm">
          <div className="flex gap-3 p-3.5 rounded-xl bg-neutral-950/60 border border-[#222222] backdrop-blur-xs transition-all hover:border-[#333333]">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-[#333333] flex items-center justify-center text-white flex-shrink-0">
              <ShieldCheck size={16} />
            </div>
            <div>
              <p className="text-xs font-semibold text-white tracking-wide">Certificação de Segurança A1</p>
              <p className="text-[10px] text-[#737373] mt-0.5">Assinatura digital e criptografia bancária AES-256 bits.</p>
            </div>
          </div>

          <div className="flex gap-3 p-3.5 rounded-xl bg-neutral-950/60 border border-[#222222] backdrop-blur-xs transition-all hover:border-[#333333]">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-[#333333] flex items-center justify-center text-white flex-shrink-0">
              <TrendingUp size={16} />
            </div>
            <div>
              <p className="text-xs font-semibold text-white tracking-wide">Previsão e Fluxo de Caixa</p>
              <p className="text-[10px] text-[#737373] mt-0.5">Análise preditiva de saldos com integração de relatórios CNAB.</p>
            </div>
          </div>

          <div className="flex gap-3 p-3.5 rounded-xl bg-neutral-950/60 border border-[#222222] backdrop-blur-xs transition-all hover:border-[#333333]">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-[#333333] flex items-center justify-center text-white flex-shrink-0">
              <Wallet size={16} />
            </div>
            <div>
              <p className="text-xs font-semibold text-white tracking-wide">Ecossistema Open Finance</p>
              <p className="text-[10px] text-[#737373] mt-0.5">Sincronismo via Pluggy com Itaú, XP, Bradesco e mais.</p>
            </div>
          </div>
        </div>

        {/* Footer info branding */}
        <div className="relative z-10 flex items-center justify-between text-[10px] text-[#737373] border-t border-[#222222]/60 pt-4">
          <span>© {new Date().getFullYear()} Vance Technologies</span>
          <span className="flex items-center gap-1.5 font-mono text-[9px] bg-neutral-900 px-2 py-0.5 rounded border border-[#222222]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Conectado com criptografia
          </span>
        </div>
      </div>


      {/* RIGHT PANEL: INTERACTIVE AUTH FORMS (Adaptable to Mobile, Tablet, Desktop) */}
      <div className="col-span-1 lg:col-span-7 flex flex-col justify-center items-center px-4 sm:px-8 py-12 md:py-24 relative overflow-y-auto w-full">
        
        {/* Background ambient lighting blobs */}
        <div className="absolute top-1/4 left-1/4 -translate-y-1/2 -translate-x-1/2 w-64 h-64 bg-white/[0.02] rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 translate-y-1/2 translate-x-1/2 w-80 h-80 bg-[#A3A3A3]/[0.015] rounded-full blur-[120px] pointer-events-none" />

        {/* Floating logo for mobile/tablets */}
        <div className="lg:hidden mb-8 self-center">
          <Logo showText={true} size="md" />
        </div>

        <div className="w-full max-w-md bg-neutral-950/80 p-6 sm:p-8 rounded-2xl border border-[#222222] backdrop-blur-md shadow-2xl relative">
          
          {/* Form Header */}
          <div className="text-center mb-6">
            {activeTab === 'login' && (
              <>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Insira suas credenciais</h2>
                <p className="text-[#A3A3A3] text-xs mt-1.5">Bem-vindo de volta! Acesse a central financeira.</p>
              </>
            )}

            {activeTab === 'signup' && (
              <>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Criar nova conta corporativa</h2>
                <p className="text-[#A3A3A3] text-xs mt-1.5">Inscreva sua equipe em segundos no sandbox de homologação.</p>
              </>
            )}

            {activeTab === 'forgot' && (
              <>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Recuperar senha de acesso</h2>
                <p className="text-[#A3A3A3] text-xs mt-1.5">Insira o e-mail associado à sua conta de tesouraria Vance.</p>
              </>
            )}
          </div>

          {/* Form errors or success alert banner */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-950/50 border border-red-900/50 text-red-400 text-xs flex gap-2 items-start shrink-0">
              <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-950/40 border border-emerald-900/50 text-emerald-400 text-xs flex gap-2 items-start">
              <Check size={15} className="mt-0.5 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: LOGIN FORM */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-medium text-[#A3A3A3] uppercase tracking-wider">E-mail Corporativo</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#737373]">
                    <Mail size={14} />
                  </span>
                  <input
                    type="email"
                    placeholder="ex: diego.terrani@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#1A1A1A] text-white border border-[#222222] focus:border-[#555555] rounded-lg text-xs py-2.5 pl-9 pr-4 transition-all outline-none"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-medium text-[#A3A3A3] uppercase tracking-wider">Senha Secreta</label>
                  <button
                    type="button"
                    onClick={() => { setActiveTab('forgot'); setError(''); setSuccessMsg(''); }}
                    className="text-[10px] text-[#A3A3A3] hover:text-white transition-colors cursor-pointer"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#737373]">
                    <Lock size={14} />
                  </span>
                  <input
                    type="password"
                    placeholder="Digite sua senha de acesso"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#1A1A1A] text-white border border-[#222222] focus:border-[#555555] rounded-lg text-xs py-2.5 pl-9 pr-4 transition-all outline-none"
                    disabled={loading}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#F5F5F5] hover:bg-white text-[#0A0A0A] font-medium text-xs py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 mt-2 cursor-pointer shadow-lg disabled:opacity-50"
              >
                {loading ? 'Autenticando...' : 'Acessar Vance Console'}
                <ArrowRight size={13} />
              </button>
            </form>
          )}

          {/* TAB 2: SIGN UP FORM */}
          {activeTab === 'signup' && (
            <form onSubmit={handleSignupSubmit} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-medium text-[#A3A3A3] uppercase tracking-wider">Nome do Operador</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#737373]">
                    <UserIcon size={14} />
                  </span>
                  <input
                    type="text"
                    placeholder="Nome completo ou Razão Social"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#1A1A1A] text-white border border-[#222222] focus:border-[#555555] rounded-lg text-xs py-2.5 pl-9 pr-4 transition-all outline-none"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-medium text-[#A3A3A3] uppercase tracking-wider">E-mail Funcional</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#737373]">
                    <Mail size={14} />
                  </span>
                  <input
                    type="email"
                    placeholder="ex: operator@vance.com.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#1A1A1A] text-white border border-[#222222] focus:border-[#555555] rounded-lg text-xs py-2.5 pl-9 pr-4 transition-all outline-none"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-medium text-[#A3A3A3] uppercase tracking-wider">Nível de Permissão (Cargo)</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full bg-[#1A1A1A] text-white border border-[#222222] focus:border-[#555555] rounded-lg text-xs py-2.5 px-3 transition-all outline-none"
                  disabled={loading}
                >
                  <option value="viewer">Observador (Visualização Simples / Leitura)</option>
                  <option value="analista">Analista de Custos (Lançamentos + Importação IA)</option>
                  <option value="tesouraria">Tesoureiro / Supervisor (Conciliação + Sincronismo)</option>
                  <option value="gerencia">Gerente Financeiro (Relatórios + Fluxo de Caixa)</option>
                  <option value="diretor">Diretor Executivo (Indicadores + Faturamento)</option>
                  <option value="admin">Administrador Geral (Controle Total / Gestão de Equipe)</option>
                </select>

                <div className="mt-2 p-3 rounded-lg bg-neutral-900 border border-[#222222] text-[10px] text-[#A3A3A3] space-y-1 animate-fade-in">
                  <p className="font-semibold text-white uppercase tracking-wider text-[8px] text-teal-400">Permissões Detalhadas do Papel:</p>
                  {role === 'viewer' && <p>• <strong>Apenas Leitura:</strong> Permissão de observação passiva de saldos e transações. Sem poder para criar lançamentos, conciliar, importar ou mexer em chaves de API.</p>}
                  {role === 'analista' && <p>• <strong>Operacional Analítico:</strong> Pode criar previsões e realizar a importação inteligente de boletos/NFs via IA. Bloqueado para validar conciliações de CNAB ou gerenciar conexões ERP.</p>}
                  {role === 'tesouraria' && <p>• <strong>Fluxo Financeiro:</strong> Sincronismo de extratos via Pluggy, uploads de CNAB e reconciliação em lote. Bloqueado para gerenciar usuários ou deletar lançamentos permanentes.</p>}
                  {role === 'gerencia' && <p>• <strong>Gestão Estratégica:</strong> Acompanhamento de fluxo de caixa previsto, configuração de limites e alertas de saldo. Bloqueado para gerenciar chaves e credenciais técnicas.</p>}
                  {role === 'diretor' && <p>• <strong>Supervisão Executiva:</strong> Visualização de faturamento do grupo, exportações estruturadas e auditoria. Bloqueado para redefinições de segurança e usuários.</p>}
                  {role === 'admin' && <p>• <strong>Controle Absoluto:</strong> Controle completo de chaves de API, webhook, convite e remoção de membros da equipe, alteração de certificados e redefinições gerais do sistema.</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-medium text-[#A3A3A3] uppercase tracking-wider">Senha Secreta</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#737373]">
                    <Lock size={14} />
                  </span>
                  <input
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#1A1A1A] text-white border border-[#222222] focus:border-[#555555] rounded-lg text-xs py-2.5 pl-9 pr-4 transition-all outline-none"
                    disabled={loading}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#F5F5F5] hover:bg-white text-[#0A0A0A] font-medium text-xs py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 mt-2 cursor-pointer shadow-lg disabled:opacity-50"
              >
                {loading ? 'Cadastrando...' : 'Criar minha credencial'}
                <ArrowRight size={13} />
              </button>
            </form>
          )}

          {/* TAB 3: PASSWORD RECOVERY */}
          {activeTab === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-medium text-[#A3A3A3] uppercase tracking-wider">E-mail Cadastrado</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-1 flex items-center pl-2 text-[#737373]">
                    <Mail size={14} />
                  </span>
                  <input
                    type="email"
                    placeholder="Digite seu e-mail cadastrado"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#1A1A1A] text-white border border-[#222222] focus:border-[#555555] rounded-lg text-xs py-2.5 pl-9 pr-4 transition-all outline-none"
                    disabled={loading}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#F5F5F5] hover:bg-white text-[#0A0A0A] font-medium text-xs py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 mt-1 cursor-pointer disabled:opacity-50"
              >
                Enviar link de recuperação
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('login'); setError(''); setSuccessMsg(''); }}
                className="w-full text-center text-xs text-[#A3A3A3] hover:text-white mt-2 cursor-pointer block underline"
              >
                Voltar ao Login
              </button>
            </form>
          )}

          {/* Bottom Switch Tab selector */}
          <div className="mt-6 pt-5 border-t border-[#222222] flex justify-center text-xs">
            {activeTab === 'login' ? (
              <p className="text-[#737373]">
                Não possui conta sandbox?{' '}
                <button
                  type="button"
                  onClick={() => { setActiveTab('signup'); setError(''); setSuccessMsg(''); }}
                  className="text-[#A3A3A3] font-semibold hover:text-white transition-colors cursor-pointer"
                >
                  Cadastre-se grátis
                </button>
              </p>
            ) : (
              activeTab !== 'forgot' && (
                <p className="text-[#737373]">
                  Já possui conta cadastrada?{' '}
                  <button
                    type="button"
                    onClick={() => { setActiveTab('login'); setError(''); setSuccessMsg(''); }}
                    className="text-[#A3A3A3] font-semibold hover:text-white transition-colors cursor-pointer"
                  >
                    Fazer Login
                  </button>
                </p>
              )
            )}
          </div>
        </div>

        {/* MOCK TEAM PROFILES QUICK ACCESS DOCK (Highly intuitive Homologation Hub) */}
        <div className="w-full max-w-md mt-6 bg-[#0E0E0E] p-4 rounded-xl border border-[#222222]">
          <div className="flex gap-1.5 items-center justify-between mb-3 border-b border-[#222222]/60 pb-2">
            <span className="text-[9px] font-mono uppercase tracking-widest text-[#737373] flex items-center gap-1">
              <Sparkles size={11} className="text-yellow-500 animate-pulse" />
              Sandbox Quick Access
            </span>
            <span className="text-[8px] bg-neutral-900 border border-[#222222] text-[#A3A3A3] font-mono px-1 rounded">
              Role Tester
            </span>
          </div>

          <p className="text-[9px] text-[#737373] leading-relaxed mb-3">
            Para facilitar a homologação e testes de perfil, clique abaixo para acessar de forma instantânea com cada nível de permissão:
          </p>

          <div className="grid grid-cols-3 gap-2">
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => {
                  setEmail(u.email);
                  setPassword('vance123'); // auto prefill mock
                  onLogin(u);
                }}
                className="p-1.5 bg-neutral-950 hover:bg-[#1A1A1A] border border-[#222222] hover:border-[#333333] rounded-lg transition-all flex flex-col items-center justify-center text-center group cursor-pointer"
              >
                <img
                  src={u.avatar}
                  alt={u.name}
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-full object-cover border border-[#222222] group-hover:border-[#555555] transition-all"
                />
                <span className="text-[9px] font-semibold text-white truncate w-full mt-1.5" title={u.name}>
                  {u.name.split(' ')[0]}
                </span>
                <span className="text-[8px] text-[#737373] uppercase tracking-wide mt-0.5 max-w-full truncate font-mono">
                  {u.role}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
