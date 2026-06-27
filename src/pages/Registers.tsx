import React, { useState } from 'react';
import { Transaction, TransactionDirection, User } from '../types';
import CurrencyDisplay from '../components/finance/CurrencyDisplay';
import { formatDate } from '../lib/formatters';
import { hasPermission, getRoleDisplayName } from '../lib/permissions';
import { 
  Plus, Trash2, Calendar, Banknote, Building, Tag, Check, ArrowUpRight, 
  ArrowDownRight, Trash, AlertCircle, ShoppingBag, Landmark, ArrowRight,
  ClipboardList, Upload, Loader2, ShieldAlert
} from 'lucide-react';

interface RegistryItem {
  id: string;
  description: string;
  direction: TransactionDirection;
  value: number;
  dueDate: string;
  bank: string;
  category: string;
  recurrence: 'single' | 'monthly' | 'yearly';
  status: 'pending' | 'realized';
  documentNumber?: string;
}

interface RegistersProps {
  transactions: Transaction[];
  onAddTransaction: (tx: Transaction) => void;
  currentUser: User;
  registries?: RegistryItem[];
  onAddRegistry?: (item: RegistryItem) => void;
  onDeleteRegistry?: (id: string) => void;
  onRealizeRegistry?: (item: RegistryItem) => void;
}

export default function Registers({
  transactions,
  onAddTransaction,
  currentUser,
  registries = [],
  onAddRegistry,
  onDeleteRegistry,
  onRealizeRegistry
}: RegistersProps) {
  // Planned entries come from Supabase (no mock).
  const registryList = registries;

  // Tab control: 'all' | 'inflow' | 'outflow'
  const [filterType, setFilterType] = useState<'all' | 'inflow' | 'outflow'>('all');
  
  // Registration Form States
  const [description, setDescription] = useState('');
  const [direction, setDirection] = useState<TransactionDirection>('inflow');
  const [value, setValue] = useState('');
  const [dueDate, setDueDate] = useState('2026-06-25');
  const [bank, setBank] = useState('Itaú Unibanco S.A.');
  const [category, setCategory] = useState('Contratos Clientes');
  const [recurrence, setRecurrence] = useState<'single' | 'monthly' | 'yearly'>('single');
  const [documentNumber, setDocumentNumber] = useState('');
  
  const [showForm, setShowForm] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const isReadOnly = !hasPermission(currentUser.role, 'canCreateRegistry');

  // Helper date generators for 1-click presets based on mock timeline base date '2026-06-21'
  const getOffsetDate = (days: number): string => {
    const baseline = new Date('2026-06-21');
    baseline.setDate(baseline.getDate() + days);
    return baseline.toISOString().split('T')[0];
  };

  const getEndOfMonthDate = (): string => {
    const baseline = new Date('2026-06-21');
    const endOfMonth = new Date(baseline.getFullYear(), baseline.getMonth() + 1, 0);
    return endOfMonth.toISOString().split('T')[0];
  };

  const getNextMonthFifth = (): string => {
    const baseline = new Date('2026-06-21');
    const nextMonth = new Date(baseline.getFullYear(), baseline.getMonth() + 1, 5);
    return nextMonth.toISOString().split('T')[0];
  };

  // Suggested Categories based on Direction
  const categoriesInflow = ['Contratos Clientes', 'Juros e Rendimentos', 'Honorários Extra', 'Aportes Sócio'];
  const categoriesOutflow = ['Sistemas e Softwares', 'Fornecedores e Logística', 'Folha de Pagamento', 'Impostos e Contribuições', 'Infraestrutura', 'Marketing e Vendas'];

  // Change default category when direction changes
  const handleDirectionChange = (dir: TransactionDirection) => {
    setDirection(dir);
    setCategory(dir === 'inflow' ? 'Contratos Clientes' : 'Sistemas e Softwares');
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!hasPermission(currentUser.role, 'canCreateRegistry')) {
      setImportError('Seu perfil de acesso atual não possui permissão para importar documentos.');
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportError(null);

    try {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'text/xml', 'application/xml'];
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      
      let mimeType = file.type;
      if (fileExt === 'xml' && !mimeType) {
        mimeType = 'text/xml';
      }

      if (!validTypes.includes(mimeType) && !['pdf', 'jpg', 'jpeg', 'png', 'xml'].includes(fileExt || '')) {
        throw new Error('Formato inválido. Envie apenas arquivos PDF, JPG, PNG ou XML.');
      }

      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = () => reject(new Error('Erro ao ler o arquivo.'));
        reader.readAsDataURL(file);
      });

      const fileContent = await base64Promise;

      const response = await fetch('/api/import-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileName: file.name,
          fileType: mimeType || `application/${fileExt}`,
          fileContent
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Falha ao processar o arquivo.');
      }

      const data = await response.json();

      if (data.description) setDescription(data.description.toUpperCase());
      if (data.direction) {
        setDirection(data.direction);
        if (data.direction === 'inflow') {
          setCategory(categoriesInflow.includes(data.category) ? data.category : 'Contratos Clientes');
        } else {
          setCategory(categoriesOutflow.includes(data.category) ? data.category : 'Sistemas e Softwares');
        }
      }
      if (data.value) setValue(Math.abs(data.value).toString());
      if (data.dueDate) setDueDate(data.dueDate);
      if (data.bank) setBank(data.bank);
      if (data.documentNumber) setDocumentNumber(data.documentNumber);

      triggerFeedback('Documento importado e campos preenchidos com sucesso!');
    } catch (err: any) {
      console.error(err);
      setImportError(err.message || 'Erro ao processar documento.');
    } finally {
      setIsImporting(false);
      if (e.target) e.target.value = '';
    }
  };

  // Stats Calculations
  const activeItems = registryList.filter(item => item.status === 'pending');
  
  const totalReceivables = activeItems
    .filter(item => item.direction === 'inflow')
    .reduce((sum, item) => sum + item.value, 0);
  
  const totalPayables = activeItems
    .filter(item => item.direction === 'outflow')
    .reduce((sum, item) => sum + Math.abs(item.value), 0);
  
  const netProjection = totalReceivables - totalPayables;

  // Add Item to registration list
  const handleCreateRegistry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPermission(currentUser.role, 'canCreateRegistry')) {
      alert(`Erro: Seu perfil de ${getRoleDisplayName(currentUser.role)} não tem permissão para criar lançamentos.`);
      return;
    }
    if (!description.trim() || !value || Number(value) <= 0) return;

    const numericValue = Number(value);
    // Standardizing sign: positive for inflow, negative for outflow
    const finalValue = direction === 'inflow' ? numericValue : -numericValue;

    const newItem: RegistryItem = {
      id: `reg-${Date.now()}`,
      description: description.toUpperCase().trim(),
      direction,
      value: finalValue,
      dueDate,
      bank,
      category,
      recurrence,
      status: 'pending',
      documentNumber: documentNumber.trim() || undefined
    };

    onAddRegistry?.(newItem);

    // Reset form
    setDescription('');
    setValue('');
    setDocumentNumber('');
    setShowForm(false);
    
    triggerFeedback('Lançamento previsto cadastrado com sucesso!');
  };

  // Delete Registry Item
  const handleDeleteItem = (id: string) => {
    if (!hasPermission(currentUser.role, 'canDeleteRegistry')) {
      alert(`Erro: Seu perfil de ${getRoleDisplayName(currentUser.role)} não tem permissão para remover lançamentos previstos.`);
      return;
    }
    onDeleteRegistry?.(id);
    triggerFeedback('Lançamento removido.');
  };

  // Launch expected item into core banking transactions (Efetivar)
  const handleLaunchToBank = (item: RegistryItem) => {
    if (!hasPermission(currentUser.role, 'canCreateRegistry')) {
      alert(`Erro: Seu perfil de ${getRoleDisplayName(currentUser.role)} não tem permissão para lançar extratos.`);
      return;
    }
    onRealizeRegistry?.(item);
    triggerFeedback(`Lançamento realizado! "${item.description}" enviado para a Fila de Conciliação.`);
  };

  const triggerFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 4000);
  };

  // Filter list
  const filteredItems = registryList.filter(item => {
    if (filterType === 'inflow' && item.direction !== 'inflow') return false;
    if (filterType === 'outflow' && item.direction !== 'outflow') return false;
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-black/5 p-4 rounded-xl border border-[var(--border-soft)]">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Contas a PAGAR/RECEBER</h1>
          <p className="text-xs text-[var(--text-secondary)]">Gerencie contas a pagar e a receber e realize integrações diretas na bancária</p>
        </div>
        
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand hover:bg-[var(--color-brand-light)] text-white text-xs font-semibold cursor-pointer transition-all shadow-md self-stretch sm:self-auto"
        >
          {showForm ? 'Fechar Formuário' : 'Novo Lançamento Previsto'}
          <Plus size={14} className={`transition-transform duration-300 ${showForm ? 'rotate-45' : ''}`} />
        </button>
      </div>

      {/* Success Feedback Banner */}
      {feedbackMessage && (
        <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-lg text-teal-500 text-xs font-medium animate-fade-in flex items-center gap-2">
          <Check size={14} className="stroke-[3]" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Form: Register New Inflow/Outflow */}
      {showForm && (
        <div className="p-5 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] animate-fade-in space-y-4 shadow-sm">
          <div className="border-b border-[var(--border-soft)] pb-3 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
              <ClipboardList size={15} className="text-brand" />
              Preencher dados do lançamento esperado
            </h3>
            <span className="text-[10px] text-[var(--text-muted)]">Crie previsões para o fluxo de caixa</span>
          </div>

          {isReadOnly && (
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500 text-xs flex items-start gap-2.5 animate-fade-in">
              <ShieldAlert size={16} className="mt-0.5 flex-shrink-0 text-amber-500" />
              <div>
                <p className="font-bold">Acesso Somente Leitura (Cargo: {getRoleDisplayName(currentUser.role)})</p>
                <p className="text-[10px] text-amber-500/80 mt-0.5">Seu nível de acesso atual permite apenas visualizar dados financeiros de lançamentos. Você não possui permissão para cadastrar ou importar novos documentos via Inteligência Artificial.</p>
              </div>
            </div>
          )}

          {/* Import NF/Boleto Smart Zone */}
          <div className="space-y-2">
            <div className={`p-4 rounded-xl border border-dashed flex flex-col items-center justify-center text-center transition-all relative ${
              isReadOnly 
                ? 'bg-neutral-900/40 border-neutral-800 opacity-60' 
                : 'bg-black/5 border-[var(--border-soft)] hover:bg-black/10'
            }`}>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.xml"
                onChange={handleFileImport}
                disabled={isImporting || isReadOnly}
                className={`absolute inset-0 w-full h-full opacity-0 ${isReadOnly ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              />
              {isImporting ? (
                <div className="flex flex-col items-center gap-2 py-3">
                  <Loader2 size={24} className="text-brand animate-spin" />
                  <span className="text-xs font-semibold text-[var(--text-primary)]">Lendo documento com Inteligência Artificial...</span>
                  <span className="text-[10px] text-[var(--text-muted)] font-mono">Analisando dados da nota fiscal ou boleto</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-2">
                  <div className="p-2 bg-brand/10 text-brand rounded-full">
                    <Upload size={18} />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-[var(--text-primary)] block">Importar via Nota Fiscal ou Boleto</span>
                    <span className="text-[10px] text-[var(--text-secondary)]">Arraste ou clique para selecionar um arquivo (PDF, JPG, PNG, XML) para preencher automaticamente</span>
                  </div>
                </div>
              )}
            </div>

            {importError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-xs font-medium flex items-center gap-2">
                <AlertCircle size={14} className="flex-shrink-0" />
                <span>{importError}</span>
              </div>
            )}
          </div>

          <form onSubmit={handleCreateRegistry} className="space-y-4 text-xs">
            {/* Split row: Direction selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Tipo de Registro</label>
                <div className="flex bg-[var(--bg-input)] rounded-lg p-0.5 border border-[var(--border-soft)] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => handleDirectionChange('inflow')}
                    className={`flex-1 py-1.5 rounded-md text-center transition-all ${
                      direction === 'inflow'
                        ? 'bg-brand text-white font-semibold shadow'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    A Receber (Entrada / Inflow)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDirectionChange('outflow')}
                    className={`flex-1 py-1.5 rounded-md text-center transition-all ${
                      direction === 'outflow'
                        ? 'bg-red-500/15 text-red-500 border border-red-500/25 font-semibold'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    A Pagar (Saída / Outflow)
                  </button>
                </div>
              </div>

              {/* Value Input */}
              <div>
                <label className="block text-[11px] font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Valor do Lançamento (R$)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-semibold text-[var(--text-muted)]">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    required
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    disabled={isReadOnly}
                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none focus:border-brand font-mono font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Row: Description & Document Number */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Descrição do Fluxo</label>
                <input
                  type="text"
                  placeholder="EX: PAGAMENTO DE CONSULTORIA, VENDA SERVIÇOS XYZ..."
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isReadOnly}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none focus:border-brand disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Num. Documento / Recibo</label>
                <input
                  type="text"
                  placeholder="EX: NF-1234, BOL-9923 (Opcional)"
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  disabled={isReadOnly}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none focus:border-brand disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Row: Bank, Category, Due date, Recurrence */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Banco de Destino</label>
                <select
                  value={bank}
                  onChange={(e) => setBank(e.target.value)}
                  disabled={isReadOnly}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none focus:border-brand disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="Itaú Unibanco S.A.">Itaú Unibanco S.A. (341)</option>
                  <option value="Banco do Brasil S.A.">Banco do Brasil S.A. (001)</option>
                  <option value="XP Investimentos">XP Investimentos (102)</option>
                  <option value="Banco C6 S.A.">Banco C6 S.A. (336)</option>
                  <option value="Caixa Econômica Federal">Caixa Econômica Federal (104)</option>
                  <option value="Banco Genial S.A.">Banco Genial S.A. (125)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Categoria Analítica</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={isReadOnly}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none focus:border-brand disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {direction === 'inflow' 
                    ? categoriesInflow.map(cat => <option key={cat} value={cat}>{cat}</option>)
                    : categoriesOutflow.map(cat => <option key={cat} value={cat}>{cat}</option>)
                  }
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Data Vencimento</label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    disabled={isReadOnly}
                    className="w-full px-3 py-2 pr-9 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none focus:border-brand font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <Calendar size={13} className="absolute right-3 top-2.5 text-[var(--text-muted)] pointer-events-none" />
                </div>
                
                {/* Previsão de Datas em 1-clique */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  <button
                    type="button"
                    onClick={() => setDueDate(getOffsetDate(0))}
                    className={`px-1.5 py-0.5 rounded text-[10px] transition-all cursor-pointer border ${
                      dueDate === getOffsetDate(0)
                        ? 'bg-brand/15 text-brand border-brand/35 font-semibold'
                        : 'bg-black/10 text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)] hover:bg-black/20'
                    }`}
                    title={`Hoje: ${getOffsetDate(0)}`}
                  >
                    Hoje
                  </button>
                  <button
                    type="button"
                    onClick={() => setDueDate(getOffsetDate(1))}
                    className={`px-1.5 py-0.5 rounded text-[10px] transition-all cursor-pointer border ${
                      dueDate === getOffsetDate(1)
                        ? 'bg-brand/15 text-brand border-brand/35 font-semibold'
                        : 'bg-black/10 text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)] hover:bg-black/20'
                    }`}
                    title={`Amanhã: ${getOffsetDate(1)}`}
                  >
                    Amanhã
                  </button>
                  <button
                    type="button"
                    onClick={() => setDueDate(getOffsetDate(5))}
                    className={`px-1.5 py-0.5 rounded text-[10px] transition-all cursor-pointer border ${
                      dueDate === getOffsetDate(5)
                        ? 'bg-brand/15 text-brand border-brand/35 font-semibold'
                        : 'bg-black/10 text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)] hover:bg-black/20'
                    }`}
                    title={`+5 Dias: ${getOffsetDate(5)}`}
                  >
                    +5D
                  </button>
                  <button
                    type="button"
                    onClick={() => setDueDate(getOffsetDate(15))}
                    className={`px-1.5 py-0.5 rounded text-[10px] transition-all cursor-pointer border ${
                      dueDate === getOffsetDate(15)
                        ? 'bg-brand/15 text-brand border-brand/35 font-semibold'
                        : 'bg-black/10 text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)] hover:bg-black/20'
                    }`}
                    title={`+15 Dias: ${getOffsetDate(15)}`}
                  >
                    +15D
                  </button>
                  <button
                    type="button"
                    onClick={() => setDueDate(getEndOfMonthDate())}
                    className={`px-1.5 py-0.5 rounded text-[10px] transition-all cursor-pointer border ${
                      dueDate === getEndOfMonthDate()
                        ? 'bg-brand/15 text-brand border-brand/35 font-semibold'
                        : 'bg-black/10 text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)] hover:bg-black/20'
                    }`}
                    title={`Último dia do mês: ${getEndOfMonthDate()}`}
                  >
                    Fim do Mês
                  </button>
                  <button
                    type="button"
                    onClick={() => setDueDate(getNextMonthFifth())}
                    className={`px-1.5 py-0.5 rounded text-[10px] transition-all cursor-pointer border ${
                      dueDate === getNextMonthFifth()
                        ? 'bg-brand/15 text-brand border-brand/35 font-semibold'
                        : 'bg-black/10 text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)] hover:bg-black/20'
                    }`}
                    title={`Dia 5 do próximo mês: ${getNextMonthFifth()}`}
                  >
                    Regra D+5
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Recorrência do Lançamento</label>
                <select
                  value={recurrence}
                  onChange={(e) => setRecurrence(e.target.value as any)}
                  disabled={isReadOnly}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none focus:border-brand disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="single">Único</option>
                  <option value="monthly">Mensal Recorrente</option>
                  <option value="yearly">Anual Recorrente</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-[var(--border-soft)] hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] rounded-lg font-semibold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isReadOnly}
                className="px-4 py-2 bg-brand text-white hover:bg-[var(--color-brand-light)] rounded-lg font-semibold transition-all shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus size={13} className="stroke-[3]" /> Confirmar Cadastro
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stats Summary Bento (No broken text on wide view) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* receivables card */}
        <div className="p-4 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] flex flex-col justify-between min-h-[96px] relative overflow-hidden group">
          <div className="flex justify-between items-start text-[var(--text-secondary)] text-[11px] uppercase tracking-wider font-semibold">
            <span>Previsão de Recebíveis</span>
            <span className="p-1 rounded-full bg-green-500/10 text-green-500">
              <ArrowUpRight size={13} />
            </span>
          </div>
          <div className="my-1 text-ellipsis overflow-hidden whitespace-nowrap">
            <CurrencyDisplay value={totalReceivables} variant="large" />
          </div>
          <p className="text-[10px] text-green-500/80 font-medium">Contas e faturamentos a receber ativos</p>
        </div>

        {/* payables card */}
        <div className="p-4 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] flex flex-col justify-between min-h-[96px] relative overflow-hidden group">
          <div className="flex justify-between items-start text-[var(--text-secondary)] text-[11px] uppercase tracking-wider font-semibold">
            <span>Previsão de Compromissos</span>
            <span className="p-1 rounded-full bg-red-500/10 text-red-500">
              <ArrowDownRight size={13} />
            </span>
          </div>
          <div className="my-1 text-ellipsis overflow-hidden whitespace-nowrap">
            <CurrencyDisplay value={-totalPayables} variant="large" />
          </div>
          <p className="text-[10px] text-red-500/80 font-medium">Contas e guias tributárias a pagar</p>
        </div>

        {/* balance net card */}
        <div className={`p-4 rounded-xl border flex flex-col justify-between min-h-[96px] relative overflow-hidden ${
          netProjection >= 0 ? 'bg-brand/5 border-brand/20' : 'bg-red-500/5 border-red-500/20'
        }`}>
          <div className="flex justify-between items-start text-[var(--text-secondary)] text-[11px] uppercase tracking-wider font-semibold">
            <span>Resultado Projetado</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
              netProjection >= 0 ? 'bg-brand/10 text-brand' : 'bg-red-500/15 text-red-500'
            }`}>
              {netProjection >= 0 ? 'Excedente' : 'Déficit'}
            </span>
          </div>
          <div className="my-1 text-ellipsis overflow-hidden whitespace-nowrap">
            <CurrencyDisplay value={netProjection} variant="large" colorize />
          </div>
          <p className="text-[10px] text-[var(--text-muted)] font-mono">Lançamentos agendados para liquidação</p>
        </div>

      </div>

      {/* Tab select & Table */}
      <div className="p-4 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] space-y-4">
        
        {/* Table Filter Tabs */}
        <div className="flex justify-between items-center border-b border-[var(--border-soft)] pb-3">
          <div className="flex gap-4 text-xs font-semibold">
            <button
              onClick={() => setFilterType('all')}
              className={`pb-3 relative transition-all ${
                filterType === 'all' ? 'text-brand border-b-2 border-brand' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              Todos ({registryList.length})
            </button>
            <button
              onClick={() => setFilterType('inflow')}
              className={`pb-3 relative transition-all ${
                filterType === 'inflow' ? 'text-brand border-b-2 border-brand font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              A Receber ({registryList.filter(r => r.direction === 'inflow').length})
            </button>
            <button
              onClick={() => setFilterType('outflow')}
              className={`pb-3 relative transition-all ${
                filterType === 'outflow' ? 'text-brand border-b-2 border-brand font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              A Pagar ({registryList.filter(r => r.direction === 'outflow').length})
            </button>
          </div>
          
          <span className="text-[10px] text-[var(--text-secondary)] font-medium">
            Mostrando {filteredItems.length} registros cadastrados
          </span>
        </div>

        {/* Master Registry Table */}
        <div className="overflow-x-auto">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-muted)] text-xs flex flex-col items-center justify-center space-y-2">
              <AlertCircle size={28} className="text-[var(--text-muted)] opacity-60" />
              <p className="font-semibold">Nenhum registro encontrado nesta categoria.</p>
              <p className="text-[10px]">Utilize o botão "Novo Lançamento Previsto" para cadastrar.</p>
            </div>
          ) : (
            <table className="w-full dense-table text-left border-collapse text-xs">
              <thead>
                <tr>
                  <th className="py-2.5 px-3">Dados Cadastrais</th>
                  <th className="py-2.5 px-3">Banco</th>
                  <th className="py-2.5 px-3">Vencimento</th>
                  <th className="py-2.5 px-3">Recorrência</th>
                  <th className="py-2.5 px-3">Recibo/Documento</th>
                  <th className="py-2.5 px-3 text-right">Valor Projetado</th>
                  <th className="py-2.5 px-3 text-center">Integração</th>
                  <th className="py-2.5 px-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-soft)]">
                {filteredItems.map((item) => {
                  const isPending = item.status === 'pending';
                  
                  return (
                    <tr 
                      key={item.id} 
                      className={`hover:bg-[var(--bg-card-hover)] transition-colors ${
                        !isPending ? 'opacity-65 bg-black/5' : ''
                      }`}
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${item.direction === 'inflow' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          <div>
                            <p className="font-semibold text-[var(--text-primary)] max-w-xs truncate" title={item.description}>
                              {item.description}
                            </p>
                            <p className="text-[10px] text-[var(--text-muted)]">{item.category}</p>
                          </div>
                        </div>
                      </td>
                      
                      <td className="py-3 px-3 text-[var(--text-secondary)] font-medium">
                        {item.bank}
                      </td>
                      
                      <td className="py-3 px-3 font-mono text-xs">
                        {formatDate(item.dueDate)}
                      </td>
                      
                      <td className="py-3 px-3 text-[var(--text-secondary)]">
                        {item.recurrence === 'single' ? 'Único' : item.recurrence === 'monthly' ? 'Mensal' : 'Anual'}
                      </td>
                      
                      <td className="py-3 px-3">
                        {item.documentNumber ? (
                          <span className="font-mono text-[10px] bg-[var(--bg-input)] px-1.5 py-0.5 rounded border border-[var(--border-soft)] text-[var(--text-primary)]">
                            {item.documentNumber}
                          </span>
                        ) : (
                          <span className="text-[10px] text-[var(--text-muted)] font-mono">—</span>
                        )}
                      </td>
                      
                      <td className="py-3 px-3 text-right font-semibold">
                        <CurrencyDisplay value={item.value} colorize />
                      </td>

                      <td className="py-3 px-3 text-center">
                        {isPending ? (
                          <button
                            onClick={() => handleLaunchToBank(item)}
                            disabled={isReadOnly}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold bg-brand/10 hover:bg-brand/20 text-brand border border-brand/20 hover:border-brand/35 rounded-lg transition-all cursor-pointer truncate disabled:opacity-40 disabled:cursor-not-allowed"
                            title={isReadOnly ? `Seu papel (${getRoleDisplayName(currentUser.role)}) não permite efetivar lançamentos` : "Lançará esta conta no painel de conciliação ativa"}
                          >
                            <Check size={11} className="stroke-[3]" /> Lançar Extrato
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold font-mono bg-green-500/10 text-green-500 border border-green-500/15 rounded uppercase">
                            Integrado
                          </span>
                        )}
                      </td>
                      
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          disabled={!hasPermission(currentUser.role, 'canDeleteRegistry')}
                          className="p-1.5 rounded text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed"
                          title={!hasPermission(currentUser.role, 'canDeleteRegistry') ? `Seu papel (${getRoleDisplayName(currentUser.role)}) não permite excluir lançamentos` : "Remover Cadastro"}
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Info notice block to secure layout */}
      <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl text-[var(--text-muted)] text-[11px] leading-relaxed flex items-start gap-2.5">
        <AlertCircle size={15} className="text-blue-400 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-bold text-[var(--text-secondary)] mb-0.5">Segurança Síncrona Vance:</p>
          <p>
            O módulo de cadastros financeiros mapeia as provisões operacionais. Ao clicar em <strong className="text-brand">"Lançar Extrato"</strong>, o registro é transmitido em tempo real para a fila de conciliação bancária de sua agência, permitindo o batimento autônomo imediato via IA com o retorno CNAB.
          </p>
        </div>
      </div>

    </div>
  );
}
