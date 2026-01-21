
import React, { useState, useEffect } from 'react';
import { Trophy, Calendar, Hash, CheckCircle2, Clock, AlertCircle, ChevronRight, Eye, Loader2, DollarSign, QrCode, Copy, Check } from 'lucide-react';
import { LOTTERY_CONFIGS, Pool, LotteryType, User, PoolGroup } from '../types';
import { db } from '../services/db';

interface MyPoolsProps {
  user: User;
}

const MyPools: React.FC<MyPoolsProps> = ({ user }) => {
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'FINISHED'>('ALL');
  const [showPixModal, setShowPixModal] = useState<{pool: Pool, amount: number} | null>(null);
  const [copied, setCopied] = useState(false);
  const [groupPix, setGroupPix] = useState<string>('financeiro@lottopool.com.br');

  useEffect(() => {
    const fetchMyPools = async () => {
      try {
        setLoading(true);
        const [allPools, groups] = await Promise.all([
            db.pools.getList(),
            db.groups.getList()
        ]);
        
        const myPools = allPools.filter(pool => 
          pool.participants.some(p => p.participantId === user.id)
        );
        setPools(myPools);
      } catch (e) {
        console.error("Erro ao carregar minhas cotas:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchMyPools();
  }, [user.id]);

  const handleCopyPix = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredPools = pools.filter(p => 
    filter === 'ALL' || p.status === filter
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-full border border-emerald-200 uppercase tracking-widest">Aberto</span>;
      case 'FINISHED':
        return <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-black rounded-full border border-amber-200 uppercase tracking-widest">Encerrado</span>;
      default:
        return <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-black rounded-full border border-slate-200 uppercase tracking-widest">Fechado</span>;
    }
  };

  if (loading) return (
    <div className="py-20 text-center">
      <Loader2 className="animate-spin mx-auto text-emerald-500 mb-4" size={48} />
      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Sincronizando suas cotas...</p>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Minhas Participações</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">Confira seus jogos ativos e prêmios acumulados.</p>
        </div>
        <div className="flex bg-white border border-slate-200 p-1.5 rounded-2xl shadow-sm">
          {(['ALL', 'OPEN', 'FINISHED'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                filter === f ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-800'
              }`}
            >
              {f === 'ALL' ? 'Todos' : f === 'OPEN' ? 'Ativos' : 'Passados'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredPools.map((pool) => {
          const config = LOTTERY_CONFIGS[pool.type as LotteryType];
          const myParticipation = pool.participants.find(p => p.participantId === user.id);
          const totalTicketsCost = pool.tickets.reduce((acc, t) => acc + t.cost, 0);
          const totalShares = pool.participants.reduce((acc, p) => acc + p.shares, 0);
          const costPerShare = totalTicketsCost / (totalShares || 1);
          const myDue = (myParticipation?.shares || 0) * costPerShare;
          
          return (
            <div key={pool.id} className="bg-white border-2 border-slate-100 rounded-[2.5rem] overflow-hidden hover:shadow-2xl transition-all group border-b-8">
              <div className="flex flex-col md:flex-row">
                <div className={`md:w-3 ${config.color}`}></div>
                
                <div className="flex-1 p-8 flex flex-col md:flex-row md:items-center justify-between gap-10">
                  <div className="flex items-center space-x-6">
                    <div className={`p-4 rounded-[1.5rem] ${config.color} text-white shadow-xl group-hover:rotate-12 transition-transform`}>
                      <Trophy size={32} />
                    </div>
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">{pool.name}</h3>
                        {getStatusBadge(pool.status)}
                      </div>
                      <div className="flex items-center space-x-5 text-[10px] text-slate-400 font-black uppercase tracking-widest">
                        <span className="flex items-center"><Calendar size={14} className="mr-1.5 text-emerald-500" /> {pool.drawDate}</span>
                        <span className="flex items-center"><Hash size={14} className="mr-1.5 text-emerald-500" /> Conc. {pool.drawNumber}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-12 border-t md:border-t-0 md:border-l border-slate-100 pt-8 md:pt-0 md:pl-12">
                    <div className="text-center md:text-left">
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-2">Minhas Cotas</p>
                      <p className="text-xl font-black text-slate-800">{myParticipation?.shares || 0} <span className="text-slate-300 font-bold">/ {totalShares}</span></p>
                    </div>
                    <div className="text-center md:text-left">
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-2">Pagamento</p>
                      {myParticipation?.paid ? (
                        <div className="flex items-center text-emerald-600 font-black text-xs uppercase tracking-widest">
                          <CheckCircle2 size={16} className="mr-2" /> Confirmado
                        </div>
                      ) : (
                        <button 
                            onClick={() => setShowPixModal({pool, amount: myDue})}
                            className="flex items-center text-rose-500 font-black text-xs uppercase tracking-widest hover:text-rose-600 transition-colors"
                        >
                          <AlertCircle size={16} className="mr-2" /> Pagar Agora
                        </button>
                      )}
                    </div>
                    <div className="hidden lg:block text-right md:text-left">
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-2">
                        {pool.status === 'FINISHED' ? 'Prêmio Recebido' : 'Investimento'}
                      </p>
                      <p className={`text-xl font-black ${pool.status === 'FINISHED' ? 'text-emerald-600' : 'text-slate-800'}`}>
                        R$ {pool.status === 'FINISHED' 
                          ? ((pool.totalPrize / totalShares) * (myParticipation?.shares || 0)).toFixed(2)
                          : myDue.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end">
                    <button className="w-full md:w-auto flex items-center justify-center space-x-3 px-8 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-slate-900/10">
                      <Eye size={18} />
                      <span>Ver Jogos</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filteredPools.length === 0 && (
          <div className="py-24 text-center bg-white border-4 border-dashed border-slate-100 rounded-[3rem]">
            <Trophy size={64} className="mx-auto mb-6 text-slate-200" />
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Nada por aqui ainda...</h3>
            <p className="text-slate-400 font-medium max-w-sm mx-auto mt-2">Participe de um grupo para começar a gerir seus bolões e números da sorte.</p>
          </div>
        )}
      </div>

      {/* MODAL PIX PAGAMENTO */}
      {showPixModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-6">
           <div className="bg-white p-12 rounded-[3rem] w-full max-w-lg shadow-2xl relative animate-in zoom-in-95 duration-300">
              <button onClick={() => setShowPixModal(null)} className="absolute top-8 right-8 p-2 hover:bg-slate-100 rounded-full text-slate-400"><XIcon /></button>
              
              <div className="text-center mb-10">
                 <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <DollarSign size={40} />
                 </div>
                 <h2 className="text-3xl font-black text-slate-800 tracking-tight">Pagamento PIX</h2>
                 <p className="text-slate-500 font-medium mt-2">Bolão: <span className="font-bold text-slate-900">{showPixModal.pool.name}</span></p>
              </div>

              <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 mb-8 flex flex-col items-center">
                  <div className="bg-white p-6 rounded-3xl shadow-inner border border-slate-200 mb-6">
                      <QrCode size={160} className="text-slate-800" />
                  </div>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">Valor a Transferir</p>
                  <p className="text-4xl font-black text-emerald-600 tracking-tight mb-8">R$ {showPixModal.amount.toFixed(2)}</p>
                  
                  <div className="w-full space-y-3">
                      <label className="text-[10px] text-slate-400 font-black uppercase ml-1 tracking-widest">Chave PIX do Grupo</label>
                      <div className="flex items-center bg-white p-4 border border-slate-200 rounded-2xl">
                          <p className="flex-1 font-bold text-slate-800 text-sm truncate">{groupPix}</p>
                          <button onClick={() => handleCopyPix(groupPix)} className="ml-4 p-2 bg-slate-900 text-white rounded-xl hover:bg-emerald-600 transition-all">
                              {copied ? <Check size={18}/> : <Copy size={18}/>}
                          </button>
                      </div>
                  </div>
              </div>

              <div className="space-y-4">
                  <p className="text-xs text-slate-400 text-center font-medium">Após realizar o pagamento, o administrador confirmará sua participação no sistema.</p>
                  <button 
                    onClick={() => setShowPixModal(null)}
                    className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-sm hover:bg-emerald-600 transition-all shadow-xl shadow-slate-900/10 active:scale-95"
                  >
                    Já realizei o Pagamento
                  </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const XIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
);

export default MyPools;
