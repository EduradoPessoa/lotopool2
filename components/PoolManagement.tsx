
import React, { useState, useEffect, useRef } from 'react';
import { Plus, Calendar, Hash, Trophy, ChevronRight, X, Check, Users, Loader2, Zap, Coins, Printer, DollarSign, Camera, FileText, Settings2, UserPlus, Search, Sliders, Ruler, Eye } from 'lucide-react';
import { LOTTERY_CONFIGS, Pool, LotteryType, Participant, User, Ticket } from '../types';
import { generateBudgetOptimizedTickets } from '../services/geminiService';
import { db } from '../services/db';
import LotteryGrid from './LotteryGrid';

interface PoolManagementProps {
  isAdmin?: boolean;
  currentUser: User;
}

const PoolManagement: React.FC<PoolManagementProps> = ({ isAdmin = false, currentUser }) => {
  const [pools, setPools] = useState<Pool[]>([]);
  const [availableParticipants, setAvailableParticipants] = useState<Participant[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [loadingAI, setLoadingAI] = useState(false);
  const [groupBudget, setGroupBudget] = useState(1000);
  const [printMode, setPrintMode] = useState<'FULL' | 'MARKS_ONLY'>('FULL');
  const [printOffset, setPrintOffset] = useState({ x: 0, y: 0 });
  const [partSearch, setPartSearch] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [newPool, setNewPool] = useState<Partial<Pool>>({
    name: '',
    drawNumber: '',
    type: 'MEGA_SENA',
    groupId: '',
    status: 'OPEN',
    paymentDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    tickets: [],
    participants: [],
    budgetUsed: 0
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [poolList, participantList, groups] = await Promise.all([
        db.pools.getList(),
        db.participants.getList(),
        db.groups.getList()
      ]);
      setPools(poolList);
      setAvailableParticipants(participantList);
      if (groups.length > 0 && !newPool.groupId) {
        setNewPool(prev => ({ ...prev, groupId: groups[0].id }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const toggleParticipantInNewPool = (pId: string) => {
    setNewPool(prev => {
      const exists = prev.participants?.find(p => p.participantId === pId);
      if (exists) {
        return { ...prev, participants: prev.participants?.filter(p => p.participantId !== pId) };
      } else {
        return { ...prev, participants: [...(prev.participants || []), { participantId: pId, shares: 1, paid: false }] };
      }
    });
  };

  const updateShares = (pId: string, shares: number) => {
    setNewPool(prev => ({
      ...prev,
      participants: prev.participants?.map(p => p.participantId === pId ? { ...p, shares: Math.max(1, shares) } : p)
    }));
  };

  const handleAIGenerate = async () => {
    try {
      setLoadingAI(true);
      const luckyOnes = availableParticipants
        .filter(p => newPool.participants?.some(np => np.participantId === p.id))
        .map(p => p.luckyNumber)
        .filter((n): n is number => !!n);

      const result = await generateBudgetOptimizedTickets(newPool.type as LotteryType, groupBudget, luckyOnes);
      if (result?.tickets) {
        setNewPool(prev => ({
          ...prev,
          tickets: result.tickets.map((t: any, i: number) => ({
            id: `ai_${Date.now()}_${i}`,
            numbers: t.numbers,
            cost: t.cost,
            status: 'PENDING'
          })),
          budgetUsed: result.totalCostUsed
        }));
      }
    } finally {
      setLoadingAI(false);
    }
  };

  const handlePrintVolantes = () => {
    window.print();
  };

  const togglePayment = async (poolId: string, partId: string) => {
    const pool = pools.find(p => p.id === poolId);
    if (!pool) return;
    const updatedParticipants = pool.participants.map(p => 
      p.participantId === partId ? { ...p, paid: !p.paid, paymentDate: !p.paid ? new Date().toISOString() : undefined } : p
    );
    await db.pools.update(poolId, { participants: updatedParticipants });
    setPools(prev => prev.map(p => p.id === poolId ? { ...p, participants: updatedParticipants } : p));
    if (selectedPool?.id === poolId) {
        setSelectedPool({...selectedPool, participants: updatedParticipants});
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, ticketId: string) => {
    const file = e.target.files?.[0];
    if (file && selectedPool) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const updatedTickets = selectedPool.tickets.map(t => 
          t.id === ticketId ? { ...t, receiptUrl: base64, status: 'REGISTERED' as const } : t
        );
        await db.pools.update(selectedPool.id, { tickets: updatedTickets });
        setSelectedPool({ ...selectedPool, tickets: updatedTickets });
      };
      reader.readAsDataURL(file);
    }
  };

  const renderPrintSlip = (ticket: Ticket, config: any) => {
    const numbers = Array.from({ length: config.range }, (_, i) => i + 1);
    const isSulfite = printMode === 'FULL';

    return (
      <div 
        key={ticket.id}
        className={`print-slip-container ${!isSulfite ? 'hide-labels' : ''}`}
        style={{ 
          transform: `translate(${printOffset.x}mm, ${printOffset.y}mm)`,
          width: '82mm',
          height: '180mm',
          padding: isSulfite ? '10mm' : '0mm',
          border: isSulfite ? '1px dashed #e2e8f0' : 'none',
          marginBottom: '20mm',
          pageBreakAfter: 'always',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          backgroundColor: 'white',
          position: 'relative'
        }}
      >
        {isSulfite && (
          <div className="text-center mb-6 w-full">
            <h4 className="text-[12px] font-black uppercase text-slate-800 tracking-widest">{selectedPool?.name}</h4>
            <div className="flex justify-between items-center mt-1 px-2">
                <p className="text-[9px] text-slate-400 font-bold">VOLANTE #{ticket.id.slice(-4)}</p>
                <p className="text-[9px] text-emerald-600 font-black uppercase">{config.name}</p>
            </div>
          </div>
        )}

        <div 
          className="grid gap-x-1.5 gap-y-1.5" 
          style={{ 
            gridTemplateColumns: `repeat(${config.gridCols}, 1fr)`,
            width: '100%',
            marginTop: isSulfite ? '0' : '22mm'
          }}
        >
          {numbers.map(num => {
            const isSelected = ticket.numbers.includes(num);
            return (
              <div 
                key={num} 
                className={`flex items-center justify-center h-[7mm] w-[7mm] transition-all
                  ${!isSulfite ? 'border-transparent' : 'border border-slate-100 rounded-md bg-slate-50/30'}`}
              >
                {isSelected ? (
                  <div className="w-[85%] h-[85%] bg-black flex items-center justify-center text-white text-[14px] font-black rounded-sm shadow-sm">X</div>
                ) : (
                  <span className={`text-[9px] font-bold ${!isSulfite ? 'opacity-0' : 'opacity-20 text-slate-400'}`}>
                    {num.toString().padStart(2, '0')}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {isSulfite && (
          <div className="mt-auto w-full border-t border-slate-100 pt-4 flex justify-between items-end">
             <div className="text-[8px] text-slate-300 font-medium">
                Gerado por LottoPool Master IA
             </div>
             <div className="text-[10px] font-black text-slate-800">
                TOTAL: R$ {ticket.cost.toFixed(2)}
             </div>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) return <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-emerald-500" size={40} /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center print:hidden">
        <h2 className="text-xl font-bold text-slate-800">Gestão de Bolões</h2>
        {isAdmin && !isCreating && (
          <button onClick={() => { setIsCreating(true); setStep(1); }} className="flex items-center space-x-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl hover:bg-emerald-700 transition-all shadow-lg font-bold">
            <Plus size={20} /> <span>Criar Novo Bolão</span>
          </button>
        )}
      </div>

      {isCreating ? (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl max-w-6xl mx-auto overflow-hidden animate-in zoom-in-95 duration-300 print:hidden">
           <div className="flex border-b border-slate-100">
              {[1, 2, 3].map(s => (
                <div key={s} className={`flex-1 py-4 text-center text-xs font-black uppercase tracking-widest ${step === s ? 'text-emerald-600 bg-emerald-50 border-b-2 border-emerald-500' : 'text-slate-300'}`}>
                   Passo {s}
                </div>
              ))}
           </div>
           
           <div className="p-10">
              {step === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-6">
                    <h3 className="font-bold text-xl text-slate-800">1. Configurações Básicas</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(LOTTERY_CONFIGS).map(([key, cfg]) => (
                        <button key={key} onClick={() => setNewPool({...newPool, type: key as LotteryType})} className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center space-y-2 ${newPool.type === key ? 'border-emerald-500 bg-emerald-50 shadow-md scale-105' : 'border-slate-100 hover:border-slate-200 bg-white'}`}>
                          <div className={`w-12 h-12 rounded-xl ${cfg.color} flex items-center justify-center text-white shadow-lg shadow-emerald-900/10`}><Trophy size={24}/></div>
                          <span className="font-bold text-slate-700 text-sm">{cfg.name}</span>
                        </button>
                      ))}
                    </div>
                    <div className="space-y-4 pt-6">
                      <label className="text-sm font-bold text-slate-700">Nome do Bolão</label>
                      <input type="text" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl" placeholder="Ex: Bolão de Verão" value={newPool.name} onChange={e => setNewPool({...newPool, name: e.target.value})} />
                      <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="text-xs font-bold text-slate-400 uppercase ml-1">Concurso</label>
                            <input type="text" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl" placeholder="2810" value={newPool.drawNumber} onChange={e => setNewPool({...newPool, drawNumber: e.target.value})} />
                         </div>
                         <div>
                            <label className="text-xs font-bold text-slate-400 uppercase ml-1">Prazo Pagamento</label>
                            <input type="date" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl" value={newPool.paymentDeadline} onChange={e => setNewPool({...newPool, paymentDeadline: e.target.value})} />
                         </div>
                      </div>
                      <button onClick={() => setStep(2)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center transition-all hover:bg-slate-800">Próximo: Selecionar Membros <ChevronRight size={18} className="ml-2"/></button>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-8 rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                    <Coins size={48} className="text-emerald-500 mb-4" />
                    <h4 className="font-bold text-slate-800">Investimento Estimado</h4>
                    <p className="text-4xl font-black text-emerald-600 mb-6">R$ {groupBudget}</p>
                    <input type="range" min="100" max="10000" step="100" value={groupBudget} onChange={e => setGroupBudget(Number(e.target.value))} className="w-full accent-emerald-600 mb-2" />
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Limite para geração IA.</p>
                  </div>
                </div>
              )}
              {step === 2 && (
                <div className="space-y-6">
                   <div className="flex justify-between items-center">
                      <h3 className="font-bold text-xl text-slate-800">2. Convocação de Membros</h3>
                      <div className="relative">
                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                         <input type="text" placeholder="Filtrar membros..." value={partSearch} onChange={e => setPartSearch(e.target.value)} className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                      </div>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {availableParticipants.filter(p => p.name.toLowerCase().includes(partSearch.toLowerCase())).map(p => (
                        <div key={p.id} onClick={() => toggleParticipantInNewPool(p.id)} className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${newPool.participants?.some(np => np.participantId === p.id) ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 bg-white'}`}>
                           <span className="text-sm font-bold text-slate-800">{p.name}</span>
                           {newPool.participants?.some(np => np.participantId === p.id) && <Check className="text-emerald-500" size={16}/>}
                        </div>
                      ))}
                   </div>
                   <div className="pt-6 flex justify-end space-x-4">
                      <button onClick={() => setStep(1)} className="px-6 py-4 border-2 border-slate-100 rounded-2xl font-bold text-slate-400">Voltar</button>
                      <button onClick={() => setStep(3)} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center">Próximo: Gerar Jogos <ChevronRight size={18} className="ml-2"/></button>
                   </div>
                </div>
              )}
              {step === 3 && (
                <div className="space-y-6">
                   <div className="flex justify-between items-center">
                      <h3 className="font-bold text-xl">3. Geração Estratégica Gemini</h3>
                      <button onClick={handleAIGenerate} disabled={loadingAI} className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center space-x-3 shadow-xl shadow-emerald-500/20 active:scale-95 transition-all">
                        {loadingAI ? <Loader2 className="animate-spin" size={20}/> : <Zap size={20}/>}
                        <span>{loadingAI ? 'IA Gerando...' : 'Gerar Jogos'}</span>
                      </button>
                   </div>
                   <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      <div className="lg:col-span-2 bg-slate-900 rounded-[2.5rem] p-8 text-white max-h-[500px] overflow-y-auto custom-scrollbar">
                         {newPool.tickets?.map((t, idx) => (
                           <div key={idx} className="bg-white/5 border border-white/10 p-5 rounded-2xl mb-4">
                              <div className="flex flex-wrap gap-2 mb-3">
                                {t.numbers.sort((a,b) => a-b).map(n => <span key={n} className="w-8 h-8 flex items-center justify-center bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-black">{n.toString().padStart(2, '0')}</span>)}
                              </div>
                              <span className="text-[10px] text-slate-500 font-bold uppercase">Cartão {idx+1} • R$ {t.cost.toFixed(2)}</span>
                           </div>
                         ))}
                      </div>
                      <div className="space-y-6">
                         <button onClick={async () => {
                              if (!newPool.name) return alert("Dê um nome ao bolão!");
                              await db.pools.create({...newPool, drawDate: new Date().toLocaleDateString(), status: 'OPEN', totalPrize: 0});
                              setIsCreating(false);
                              loadData();
                            }} className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-lg shadow-2xl hover:bg-slate-800 transition-all">
                               Ativar Bolão
                         </button>
                      </div>
                   </div>
                </div>
              )}
           </div>
        </div>
      ) : selectedPool ? (
        <div className="space-y-6">
           <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 print:hidden shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-6">
                 <div>
                    <button onClick={() => setSelectedPool(null)} className="text-emerald-600 font-black flex items-center mb-4 hover:translate-x-[-4px] transition-transform text-xs uppercase tracking-widest"><ChevronRight className="rotate-180 mr-1" size={14}/> Voltar para Lista</button>
                    <h2 className="text-4xl font-black text-slate-800 tracking-tight leading-none mb-3">{selectedPool.name}</h2>
                    <div className="flex items-center space-x-4">
                       <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase text-white shadow-lg shadow-emerald-900/10 ${LOTTERY_CONFIGS[selectedPool.type].color}`}>{LOTTERY_CONFIGS[selectedPool.type].name}</span>
                       <span className="text-slate-400 font-bold text-xs bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200/50">Conc. {selectedPool.drawNumber}</span>
                       <span className="text-slate-400 font-bold text-xs bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200/50">{selectedPool.drawDate}</span>
                    </div>
                 </div>
                 
                 <div className="flex items-center space-x-3 bg-slate-50 p-2.5 rounded-[2rem] border border-slate-200 shadow-sm">
                    <div className="flex items-center bg-white rounded-[1.5rem] shadow-sm border border-slate-100 p-1">
                        <button onClick={() => setPrintMode('FULL')} className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${printMode === 'FULL' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'}`}>Sulfite A4</button>
                        <button onClick={() => setPrintMode('MARKS_ONLY')} className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${printMode === 'MARKS_ONLY' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'}`}>Volante Caixa</button>
                    </div>
                    <button onClick={handlePrintVolantes} className="p-4 bg-emerald-600 text-white rounded-[1.5rem] hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/20 active:scale-95 group">
                        <Printer size={22} className="group-hover:rotate-12 transition-transform" />
                    </button>
                 </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                 <div className="space-y-8">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <h3 className="font-black text-slate-800 flex items-center uppercase text-xs tracking-widest"><Settings2 className="mr-3 text-emerald-500" size={20}/> Calibração da Impressora</h3>
                            <button onClick={() => setPrintOffset({x: 0, y: 0})} className="text-[10px] font-black text-slate-400 hover:text-rose-500 transition-colors">RESETAR</button>
                        </div>
                        <div className="bg-slate-50 rounded-[2.5rem] p-10 border border-slate-200 shadow-inner grid grid-cols-1 md:grid-cols-2 gap-10">
                           <div className="space-y-4">
                              <div className="flex justify-between items-center mb-2">
                                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center"><Sliders className="mr-2" size={14}/> Deslocamento X (MM)</label>
                                <span className="bg-white px-3 py-1 rounded-full text-xs font-black text-emerald-600 border border-emerald-100 shadow-sm">{printOffset.x}mm</span>
                              </div>
                              <input type="range" min="-10" max="10" step="0.5" value={printOffset.x} onChange={e => setPrintOffset(prev => ({...prev, x: Number(e.target.value)}))} className="w-full accent-emerald-500 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                           </div>
                           <div className="space-y-4">
                              <div className="flex justify-between items-center mb-2">
                                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center"><Sliders className="mr-2" size={14}/> Deslocamento Y (MM)</label>
                                <span className="bg-white px-3 py-1 rounded-full text-xs font-black text-emerald-600 border border-emerald-100 shadow-sm">{printOffset.y}mm</span>
                              </div>
                              <input type="range" min="-10" max="10" step="0.5" value={printOffset.y} onChange={e => setPrintOffset(prev => ({...prev, y: Number(e.target.value)}))} className="w-full accent-emerald-500 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                           </div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4">
                        <h3 className="font-black text-slate-800 flex items-center uppercase text-xs tracking-widest border-b border-slate-100 pb-4"><DollarSign className="mr-3 text-emerald-500" size={20}/> Pagamentos</h3>
                        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-3 custom-scrollbar">
                           {availableParticipants.filter(p => selectedPool.participants.some(sp => sp.participantId === p.id)).map(p => {
                              const partStatus = selectedPool.participants.find(sp => sp.participantId === p.id);
                              const poolCost = selectedPool.tickets.reduce((acc, t) => acc + t.cost, 0);
                              const totalShares = selectedPool.participants.reduce((acc, ps) => acc + ps.shares, 0);
                              const valorDevido = (poolCost / totalShares) * (partStatus?.shares || 0);
                              
                              return (
                                <div key={p.id} className="flex items-center justify-between p-5 bg-white rounded-3xl border border-slate-100 shadow-sm hover:border-emerald-200 transition-all hover:bg-slate-50/50">
                                   <div className="flex items-center space-x-4">
                                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black shadow-sm ${partStatus?.paid ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>{p.name.charAt(0)}</div>
                                      <div>
                                         <p className="text-sm font-black text-slate-800">{p.name}</p>
                                         <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">R$ {valorDevido.toFixed(2)} • {partStatus?.shares} cotas</p>
                                      </div>
                                   </div>
                                   <button onClick={() => togglePayment(selectedPool.id, p.id)} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${partStatus?.paid ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
                                      {partStatus?.paid ? 'PAGO' : 'PENDENTE'}
                                   </button>
                                </div>
                              );
                           })}
                        </div>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <h3 className="font-black text-slate-800 flex items-center uppercase text-xs tracking-widest border-b border-slate-100 pb-4"><Eye className="mr-3 text-emerald-500" size={20}/> Visualização dos Jogos</h3>
                    <div className="grid grid-cols-1 gap-8 max-h-[850px] overflow-y-auto pr-3 custom-scrollbar">
                       {selectedPool.tickets.map((t, i) => (
                         <div key={t.id} className="p-8 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:border-emerald-100 transition-all group overflow-hidden">
                            <div className="flex justify-between items-center mb-6">
                               <div className="flex items-center space-x-3">
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-lg ${LOTTERY_CONFIGS[selectedPool.type].color}`}>
                                    {i + 1}
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">VOLANTE OFICIAL</span>
                               </div>
                               <div className="text-right">
                                  <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">R$ {t.cost.toFixed(2)}</p>
                               </div>
                            </div>

                            <div className="mb-8 scale-90 sm:scale-100 origin-top-left">
                               <LotteryGrid 
                                  type={selectedPool.type} 
                                  selectedNumbers={t.numbers} 
                                  selectedExtras={t.extraNumbers}
                                  onToggleNumber={() => {}}
                                  onToggleExtra={() => {}}
                               />
                            </div>

                            <div className="flex justify-between items-center pt-6 border-t border-slate-100">
                               <div className="flex space-x-3">
                                  <input type="file" className="hidden" ref={fileInputRef} accept="image/*" onChange={(e) => handleFileUpload(e, t.id)} />
                                  <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm border border-slate-100" title="Digitalizar Volante"><Camera size={18}/></button>
                                  {t.receiptUrl && <button onClick={() => window.open(t.receiptUrl)} className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-emerald-100" title="Ver Comprovante"><FileText size={18}/></button>}
                               </div>
                               <div className="text-[9px] text-slate-300 font-bold italic">
                                  {t.status === 'REGISTERED' ? 'CONFERIDO PELA CAIXA' : 'AGUARDANDO REGISTRO'}
                                </div>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
           </div>

           <div className="hidden print:block print-area">
              <div className="print-grid">
                 {selectedPool.tickets.map(ticket => renderPrintSlip(ticket, LOTTERY_CONFIGS[selectedPool.type]))}
              </div>
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 print:hidden">
          {pools.map(pool => {
            const config = LOTTERY_CONFIGS[pool.type];
            return (
              <div key={pool.id} onClick={() => setSelectedPool(pool)} className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden hover:shadow-2xl transition-all group cursor-pointer border-b-8 border-b-slate-100 hover:border-b-emerald-500 scale-100 hover:scale-[1.02]">
                <div className={`${config.color} p-10 text-white relative overflow-hidden`}>
                   <div className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-125 transition-transform duration-700">
                       <Trophy size={160} />
                   </div>
                   <div className="relative z-10">
                      <div className="flex justify-between items-start mb-6">
                         <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md"><Trophy size={28}/></div>
                         <div className="text-right">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Conc. {pool.drawNumber}</p>
                            <p className="text-xs font-bold">{pool.drawDate}</p>
                         </div>
                      </div>
                      <h3 className="text-2xl font-black truncate pr-4 tracking-tight">{pool.name}</h3>
                      <p className="text-xs opacity-80 font-black uppercase tracking-wider mt-1">{config.name}</p>
                   </div>
                </div>
                <div className="p-8 flex justify-between items-center bg-slate-50/50">
                  <div className="flex items-center text-xs text-slate-500 font-black uppercase tracking-widest"><Users size={16} className="mr-2 text-slate-400"/> {pool.participants.length} MEMBROS</div>
                  <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${pool.status === 'OPEN' ? 'border-emerald-200 text-emerald-600' : 'border-slate-200 text-slate-400'}`}>
                    {pool.status === 'OPEN' ? 'Ativo' : 'Encerrado'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @media screen {
            .print-area { display: none; }
        }

        @media print {
          @page { 
            margin: 0; 
            size: A4; 
          }
          
          body { 
            margin: 0; 
            padding: 0; 
            background: white !important; 
          }
          
          header, aside, .print:hidden, button, .no-print, input[type="range"] { 
            display: none !important; 
          }
          
          #root { 
            padding: 0 !important; 
            margin: 0 !important; 
          }
          
          main { 
            padding: 0 !important; 
            overflow: visible !important; 
            background: white !important;
          }
          
          .print-area { 
            display: block !important; 
            padding: 0; 
            margin: 0; 
          }
          
          .print-grid {
            display: flex;
            flex-direction: column;
            align-items: center;
          }

          .hide-labels span { 
            visibility: hidden !important; 
          }
          
          .print-slip-container { 
            break-inside: avoid; 
            margin: 0 auto !important; 
            box-shadow: none !important;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PoolManagement;
