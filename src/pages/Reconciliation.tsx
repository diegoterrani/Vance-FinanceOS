import React, { useState } from 'react';
import { Transaction } from '../types';
import CurrencyDisplay from '../components/finance/CurrencyDisplay';
import { formatDate } from '../lib/formatters';
import { Upload, HelpCircle, Check, Search, Filter, RefreshCw, X, AlertTriangle, ChevronRight, FileSpreadsheet, Percent, Info, ArrowRight, CornerDownRight } from 'lucide-react';

interface ReconciliationProps {
  transactions: Transaction[];
  onUpdateStatus: (id: string, newStatus: any) => void;
  onAddTransaction: (tx: Transaction) => void;
}

export default function Reconciliation({
  transactions,
  onUpdateStatus,
  onAddTransaction
}: ReconciliationProps) {
  // Tabs
  const [activeTab, setActiveTab] = useState<'pending' | 'auto' | 'resolved'>('pending');
  
  // Filters
  const [search, setSearch] = useState('');
  const [selectedBank, setSelectedBank] = useState('all');
  const [minScore, setMinScore] = useState(0.5);
  const [onlyAiSuggestions, setOnlyAiSuggestions] = useState(false);

  // Bulk selections
  const [selectedTxIds, setSelectedTxIds] = useState<string[]>([]);
  
  // Detail drawer state
  const [activeDrawerTx, setActiveDrawerTx] = useState<Transaction | null>(null);

  // Drag and drop CNAB upload states
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [parsedLinesLogs, setParsedLinesLogs] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Filter computations
  const getFilteredTransactions = () => {
    return transactions.filter(t => {
      // Tab matching
      if (activeTab === 'pending' && t.status !== 'pending') return false;
      if (activeTab === 'auto' && t.score && t.score < 0.85) return false; // auto matches
      if (activeTab === 'resolved' && t.status !== 'matched') return false;

      // Filter attributes
      if (selectedBank !== 'all' && t.bank !== selectedBank) return false;
      if (t.score !== undefined && t.score < minScore) return false;
      if (onlyAiSuggestions && !t.score) return false;

      // Text query
      if (search) {
        const query = search.toLowerCase();
        return (
          t.description.toLowerCase().includes(query) ||
          t.bank.toLowerCase().includes(query) ||
          t.reference.toLowerCase().includes(query) ||
          t.category.toLowerCase().includes(query)
        );
      }
      return true;
    });
  };

  const filteredTx = getFilteredTransactions();

  // Multi select togglers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTxIds(filteredTx.map(t => t.id));
    } else {
      setSelectedTxIds([]);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedTxIds(prev => [...prev, id]);
    } else {
      setSelectedTxIds(prev => prev.filter(item => item !== id));
    }
  };

  // Drag-and-drop file trigger
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      simulateParsing(files[0].name, files[0].size);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      simulateParsing(e.target.files[0].name, e.target.files[0].size);
    }
  };

  // High fidelity parsing simulator
  const simulateParsing = (filename: string, filesize: number) => {
    if (filesize > 50 * 1024 * 1024) {
      alert('Tamanho limite de arquivo excedido (max 50MB)');
      return;
    }
    const ext = filename.split('.').pop()?.toLowerCase();
    if (!['ofx', 'cnab', 'ret', 'txt'].includes(ext || '')) {
      alert('Formato incompatível. Formatos desejados: .ofx, .cnab, .ret, .txt');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    setParsedLinesLogs(['Iniciando leitura do arquivo ' + filename, 'Validando cabeçalhos de remessa...']);

    // Staged updates
    setTimeout(() => {
      setUploadProgress(40);
      setParsedLinesLogs(prev => [...prev, 'Encontrado HEADER do banco emissor', 'Analisando lote 1: 14 transações detectadas']);
    }, 600);

    setTimeout(() => {
      setUploadProgress(75);
      setParsedLinesLogs(prev => [...prev, 'Processando transações lineares...', 'Mapeando registros de pagamento - Detalhe Segmento A']);
    }, 1200);

    setTimeout(() => {
      setUploadProgress(100);
      setParsedLinesLogs(prev => [...prev, 'Conciliação automática gerada. 4 novos pares correlacionados!', 'Retorno processado com sucesso.']);
      
      // Inject some new items
      const newTx: Transaction = {
        id: 'new-parsed-1',
        description: 'VANCE GESTÃO PROCESSAMENTO RETORNO',
        bank: 'Itaú Unibanco S.A.',
        bankCode: '341',
        direction: 'inflow',
        status: 'pending',
        value: 12500.00,
        date: '2026-06-21',
        reference: 'NF-E RETORNO AUTOMATICO',
        category: 'Contratos Clientes',
        score: 0.94,
        externalId: 'EXT-9988'
      };
      onAddTransaction(newTx);

      const newTx2: Transaction = {
        id: 'new-parsed-2',
        description: 'PAGAMENTO FORNECEDOR SILVA SERVIÇOS',
        bank: 'Banco do Brasil S.A.',
        bankCode: '001',
        direction: 'outflow',
        status: 'pending',
        value: -3100.00,
        date: '2026-06-20',
        reference: 'DUPLICATA FORN-4512',
        category: 'Fornecedores',
        score: 0.76,
        externalId: 'EXT-9989'
      };
      onAddTransaction(newTx2);

    }, 2000);
  };

  // Action dispatcher
  const handleBulkConfirm = () => {
    selectedTxIds.forEach(id => {
      onUpdateStatus(id, 'matched');
    });
    setSelectedTxIds([]);
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-black/5 p-4 rounded-xl border border-[var(--border-soft)]">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Conciliação Bancária Independente</h1>
          <p className="text-xs text-[var(--text-secondary)]">Faça a correspondência de extratos bancários com os registros do ERP Vance</p>
        </div>
        
        {/* CNAB Trigger action or upload button */}
        <div className="w-full md:w-auto">
          <label className="text-xs bg-brand text-white px-4 py-2 hover:bg-[var(--color-brand-light)] font-semibold rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md">
            <Upload size={14} /> Importar Retorno (.CNAB / .OFX)
            <input
              type="file"
              onChange={handleFileSelect}
              accept=".ofx,.cnab,.ret,.txt"
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Tabs list (Pending counter) */}
      <div className="flex border-b border-[var(--border-soft)] gap-4 text-xs">
        <button
          onClick={() => { setActiveTab('pending'); setSelectedTxIds([]); }}
          className={`pb-3 font-semibold relative ${
            activeTab === 'pending'
              ? 'text-brand border-b-2 border-brand'
              : 'text-[var(--text-secondary)] hover:text-foreground'
          }`}
        >
          Pendentes para Análise ({transactions.filter(t => t.status === 'pending').length})
        </button>
        <button
          onClick={() => { setActiveTab('auto'); setSelectedTxIds([]); }}
          className={`pb-3 font-semibold relative ${
            activeTab === 'auto'
              ? 'text-brand border-b-2 border-brand'
              : 'text-[var(--text-secondary)] hover:text-foreground'
          }`}
        >
          Auto-Conciliados (IA &gt;85%)
        </button>
        <button
          onClick={() => { setActiveTab('resolved'); setSelectedTxIds([]); }}
          className={`pb-3 font-semibold relative ${
            activeTab === 'resolved'
              ? 'text-brand border-b-2 border-brand'
              : 'text-[var(--text-secondary)] hover:text-foreground'
          }`}
        >
          Histórico Concluído
        </button>
      </div>

      {/* Upload parsing simulator display */}
      {isUploading && (
        <div className="p-4 rounded-xl border border-teal-500/30 bg-teal-500/5 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold flex items-center gap-1.5 text-teal-400">
              <RefreshCw size={13} className="animate-spin" /> Processando Extrato CNAB...
            </span>
            <span className="font-mono font-semibold">{uploadProgress}%</span>
          </div>

          <div className="w-full bg-[var(--border-soft)] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-brand h-full rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>

          <div className="p-3 bg-black/25 rounded border border-[var(--border-soft)] font-mono text-[10px] text-[var(--text-secondary)] max-h-32 overflow-y-auto space-y-1">
            {parsedLinesLogs.map((log, idx) => (
              <p key={idx} className="flex gap-2">
                <span className="text-teal-600">&gt;</span> {log}
              </p>
            ))}
          </div>

          {uploadProgress === 100 && (
            <div className="flex justify-between items-center pt-1 text-xs">
              <span className="text-green-500 font-semibold">Tabela de lançamentos atualizada automaticamente!</span>
              <button
                onClick={() => { setIsUploading(false); setUploadProgress(null); }}
                className="text-teal-400 font-bold hover:underline"
              >
                Dispensar painel
              </button>
            </div>
          )}
        </div>
      )}

      {/* Grid: Tabela filter area + lateral dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Columns (Table list + Filters) */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Filters Bar */}
          <div className="p-4 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] flex flex-wrap gap-4 items-center">
            
            {/* Text input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-2.5 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Filtrar por descrição ou categoria..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-[var(--border-soft)] bg-[var(--bg-input)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-brand"
              />
            </div>

            {/* Selector bank */}
            <div className="text-xs">
              <select
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                className="px-3 py-2 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none"
              >
                <option value="all">Todas as Contas</option>
                <option value="Itaú Unibanco S.A.">Itaú Unibanco</option>
                <option value="Banco do Brasil S.A.">Banco do Brasil S.A.</option>
                <option value="XP Investimentos">XP Investimentos</option>
              </select>
            </div>

            {/* Score slide filter */}
            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <span>Confiança IA &gt;</span>
              <input
                type="range"
                min="0.4"
                max="0.99"
                step="0.05"
                value={minScore}
                onChange={(e) => setMinScore(parseFloat(e.target.value))}
                className="accent-brand cursor-pointer w-24 h-1 bg-[var(--border-soft)] rounded-lg appearance-none"
              />
              <span className="font-mono bg-[var(--bg-input)] px-1.5 py-0.5 rounded border border-[var(--border-soft)]">
                {Math.round(minScore * 100)}%
              </span>
            </div>

            {/* AI Toggle */}
            <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)] cursor-pointer">
              <input
                type="checkbox"
                checked={onlyAiSuggestions}
                onChange={(e) => setOnlyAiSuggestions(e.target.checked)}
                className="accent-brand border-[var(--border-soft)] bg-[var(--bg-input)]"
              />
              Apenas sugestões da Inteligência
            </label>

          </div>

          {/* Bulk actions display */}
          {selectedTxIds.length > 0 && (
            <div className="p-3 bg-teal-500/10 border-l-4 border-brand text-xs text-[var(--text-primary)] flex items-center justify-between rounded-r-lg animate-fade-in">
              <div className="flex items-center gap-2">
                <Info size={14} className="text-brand" />
                <span>Você selecionou <strong>{selectedTxIds.length}</strong> transações para processamento</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleBulkConfirm}
                  className="bg-brand hover:bg-[var(--color-brand-light)] text-white px-3 py-1.5 rounded font-semibold transition-all cursor-pointer flex items-center gap-1 text-[11px]"
                >
                  <Check size={12} /> Confirmar Lote
                </button>
                <button
                  onClick={() => setSelectedTxIds([])}
                  className="bg-black/25 hover:bg-black/40 border border-[var(--border-soft)] text-[var(--text-secondary)] px-3 py-1.5 rounded transition-all cursor-pointer text-[11px]"
                >
                  Voltar
                </button>
              </div>
            </div>
          )}

          {/* Table ledger */}
          <div className="p-4 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] overflow-x-auto">
            {filteredTx.length === 0 ? (
              <div className="p-12 text-center text-[var(--text-secondary)] flex flex-col items-center justify-center space-y-3">
                <FileSpreadsheet size={40} className="text-[var(--text-muted)] animate-bounce" />
                <p className="text-sm font-semibold">Nenhuma transação pendente encontrada</p>
                <p className="text-xs">Altere as configurações de filtros ou realize a importação de extrato .OFX para visualizar itens.</p>
              </div>
            ) : (
              <table className="w-full dense-table text-left border-collapse">
                <thead>
                  <tr>
                    <th className="w-8">
                      <input
                        type="checkbox"
                        checked={selectedTxIds.length === filteredTx.length && filteredTx.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="accent-brand rounded"
                      />
                    </th>
                    <th>Correspondência Encontrada pelo Vance</th>
                    <th className="text-center">Confiança</th>
                    <th className="hidden sm:table-cell">Agrupamento</th>
                    <th className="text-right">Valor</th>
                    <th className="w-12">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-soft)]">
                  {filteredTx.map((tx) => {
                    const isSelected = selectedTxIds.includes(tx.id);
                    
                    // Style indicator based on confidence score
                    let scoreBadge = 'bg-gray-500/10 text-gray-500';
                    let scoreText = 'Manual';
                    if (tx.score) {
                      if (tx.score >= 0.85) {
                        scoreBadge = 'bg-green-500/15 text-green-500';
                        scoreText = 'Auto';
                      } else if (tx.score >= 0.60) {
                        scoreBadge = 'bg-amber-500/15 text-amber-500';
                        scoreText = 'Sugerido';
                      }
                    }

                    return (
                      <tr
                        key={tx.id}
                        className={`hover:bg-[var(--bg-card-hover)] cursor-pointer ${
                          isSelected ? 'bg-brand/5' : ''
                        }`}
                        onClick={() => setActiveDrawerTx(tx)}
                      >
                        <td onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => handleSelectRow(tx.id, e.target.checked)}
                            className="accent-brand rounded"
                          />
                        </td>
                        <td>
                          {/* Side-by-side reconciliation visualization */}
                          <div className="flex flex-col md:flex-row gap-3 md:items-center">
                            {/* System Record */}
                            <div className="flex-1">
                              <span className="text-[10px] uppercase font-semibold text-brand tracking-widest block mb-0.5">Sistema (Vance)</span>
                              <div className="font-semibold text-[var(--text-primary)]">{tx.description}</div>
                              <div className="text-[10px] text-[var(--text-muted)] font-mono">Ref: {tx.reference}</div>
                            </div>

                            {tx.score && (
                              <div className="hidden md:flex items-center text-[var(--text-muted)]">
                                <ArrowRight size={14} />
                              </div>
                            )}

                            {/* Bank Record */}
                            {tx.score ? (
                              <div className="flex-1 opacity-90 border-l md:border-l-0 md:pl-0 pl-3 border-[var(--border-soft)]">
                                <span className="text-[10px] uppercase font-semibold text-blue-400 tracking-widest block mb-0.5">Extrato Bancário</span>
                                <div className="text-[var(--text-primary)] truncate max-w-[200px]">{tx.reference}</div>
                                <div className="text-[10px] text-[var(--text-muted)] font-mono">{tx.bank}</div>
                              </div>
                            ) : (
                              <div className="flex-1 text-[var(--text-muted)] italic flex items-center gap-1 text-[11px]">
                                <AlertTriangle size={13} className="text-amber-500" /> Sem extrato correspondente
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="text-center">
                          {tx.score ? (
                            <div className="flex flex-col items-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${scoreBadge}`}>
                                {scoreText}
                              </span>
                              <span className="text-[10px] text-[var(--text-secondary)] font-mono mt-0.5">
                                {Math.round(tx.score * 100)}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-[var(--text-muted)] font-mono">—</span>
                          )}
                        </td>
                        <td className="hidden sm:table-cell text-xs text-[var(--text-secondary)]">
                          {tx.category}
                        </td>
                        <td className="text-right">
                          <CurrencyDisplay value={tx.value} colorize />
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-1.5 justify-end">
                            <button
                              onClick={() => onUpdateStatus(tx.id, 'matched')}
                              className="p-1.5 rounded bg-green-500/10 hover:bg-green-500 hover:text-white text-green-500 transition-all cursor-pointer"
                              title="Aprovar par"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => onUpdateStatus(tx.id, 'disputed')}
                              className="p-1.5 rounded bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 transition-all cursor-pointer"
                              title="Reportar disputa"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Lateral Panel (Detail Drawer Simulator) */}
        <div className="lg:col-span-1">
          {activeDrawerTx ? (
            <div className="p-4 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-card)] text-xs space-y-4 shadow-xl sticky top-20">
              <div className="flex justify-between items-center border-b border-[var(--border-soft)] pb-3">
                <span className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-1.5">
                  <FileSpreadsheet size={15} className="text-brand" /> Detalhes Lançamento
                </span>
                <button
                  onClick={() => setActiveDrawerTx(null)}
                  className="p-1 rounded-full hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Par Details */}
              <div className="space-y-4">
                
                {/* System panel */}
                <div className="p-3 rounded-lg bg-black/15 border border-[var(--border-soft)] space-y-1.5">
                  <span className="text-[9px] uppercase tracking-wider font-bold text-brand">Registo no ERP Vance</span>
                  <p className="font-semibold text-[var(--text-primary)] font-sans">{activeDrawerTx.description}</p>
                  <p className="text-[10px] text-[var(--text-secondary)]">Categoria: <strong>{activeDrawerTx.category}</strong></p>
                  <p className="text-[10px] text-[var(--text-secondary)]">ID Interno: <code>{activeDrawerTx.id}</code></p>
                  <p className="text-[10px] text-[var(--text-secondary)]">Ref: {activeDrawerTx.reference}</p>
                </div>

                {/* Arrow Match Indicator */}
                {activeDrawerTx.score && (
                  <div className="flex flex-col items-center py-1">
                    <span className="text-[10px] text-green-500 font-mono font-bold bg-green-500/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Percent size={11} /> Match de correspondência artificial {Math.round(activeDrawerTx.score * 100)}%
                    </span>
                  </div>
                )}

                {/* Platform panel */}
                <div className="p-3 rounded-lg bg-black/15 border border-[var(--border-soft)] space-y-1.5">
                  <span className="text-[9px] uppercase tracking-wider font-bold text-blue-400">Transação Extrato Sincronizado</span>
                  {activeDrawerTx.score ? (
                    <>
                      <p className="font-semibold text-[var(--text-primary)] font-sans">{activeDrawerTx.reference}</p>
                      <p className="text-[10px] text-[var(--text-secondary)]">Banco: {activeDrawerTx.bank}</p>
                      <p className="text-[10px] text-[var(--text-muted)]">Cód: {activeDrawerTx.bankCode}</p>
                      <p className="text-[10px] text-[var(--text-secondary)]">Data Conciliação: {formatDate(activeDrawerTx.date)}</p>
                    </>
                  ) : (
                    <div className="text-[var(--text-muted)] italic py-2">
                       Sem transação semelhante encontrada no extrato. Requer preenchimento manual ou correspondência direta.
                    </div>
                  )}
                </div>

                {/* Total Value visual */}
                <div className="flex justify-between items-center bg-black/10 p-3 rounded border border-[var(--border-soft)] font-mono text-base font-bold">
                  <span>Valor Líquido:</span>
                  <CurrencyDisplay value={activeDrawerTx.value} colorize />
                </div>

                {/* Drawer Actions buttons */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={() => {
                      onUpdateStatus(activeDrawerTx.id, 'matched');
                      setActiveDrawerTx(null);
                    }}
                    className="w-full bg-brand hover:bg-[var(--color-brand-light)] text-white font-semibold py-2 rounded transition-all cursor-pointer text-center text-[11px]"
                  >
                    Vincular Registros
                  </button>
                  <button
                    onClick={() => {
                      onUpdateStatus(activeDrawerTx.id, 'disputed');
                      setActiveDrawerTx(null);
                    }}
                    className="w-full bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 font-semibold py-2 rounded transition-all border border-red-500/20 cursor-pointer text-center text-[11px]"
                  >
                    Reportar Erro
                  </button>
                </div>

              </div>

            </div>
          ) : (
            <div className="p-6 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] text-center text-[var(--text-muted)] space-y-3 sticky top-20">
              <HelpCircle size={32} className="mx-auto text-[var(--text-muted)] opacity-60" />
              <p className="text-xs font-semibold">Nenhum par selecionado</p>
              <p className="text-[10px]">Clique em qualquer lançamento na lista esquerda para exibir detalhamento, simular similaridade e revisar auditorias de segurança.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
