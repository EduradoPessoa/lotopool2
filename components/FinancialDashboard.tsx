import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Calendar,
  DollarSign
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { User, Pool, Participant } from '../types';
import { db } from '../services/db';

const financialData = [
  { month: 'Set', revenue: 400, expense: 200 },
  { month: 'Out', revenue: 600, expense: 400 },
  { month: 'Nov', revenue: 500, expense: 300 },
  { month: 'Dez', revenue: 1500, expense: 800 },
  { month: 'Jan', revenue: 1100, expense: 600 },
  { month: 'Fev', revenue: 2400, expense: 1200 },
];

interface FinancialDashboardProps {
  user?: User | null;
}

const FinancialDashboard: React.FC<FinancialDashboardProps> = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [myPayments, setMyPayments] = useState<any[]>([]);
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [prizes, setPrizes] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalPaid: 0,
    totalPending: 0,
    totalPrizes: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const [allPools, allParticipants] = await Promise.all([
          db.pools.getList(),
          db.participants.getList()
        ]);

        if (user.role === 'POOL_MEMBER') {
            const me = allParticipants.find(p => p.profileId === user.id || p.email === user.email);
            if (!me) {
                setLoading(false);
                return;
            }

            const myPools = allPools.filter(pool => 
                pool.participants.some(p => p.participantId === me.id)
            );

            const pending = [];
            const paid = [];
            const myPrizes = [];
            let sumPaid = 0;
            let sumPending = 0;
            let sumPrizes = 0;

            for (const pool of myPools) {
                const participation = pool.participants.find(p => p.participantId === me.id);
                if (!participation) continue;

                // Calculate Cost
                const totalTicketsCost = pool.tickets.reduce((acc: number, t: any) => acc + t.cost, 0);
                const totalShares = pool.participants.reduce((acc: number, p: any) => acc + p.shares, 0);
                const costPerShare = totalTicketsCost / (totalShares || 1);
                const myCost = (participation.shares || 0) * costPerShare;

                // Calculate Prize
                const myPrizeValue = pool.status === 'FINISHED' 
                    ? (pool.totalPrize / totalShares) * participation.shares
                    : 0;

                if (participation.paid) {
                    paid.push({
                        id: pool.id,
                        poolName: pool.name,
                        date: participation.paymentDate || pool.created_at, // Fallback date
                        amount: myCost,
                        status: 'CONFIRMED'
                    });
                    sumPaid += myCost;
                } else {
                    pending.push({
                        id: pool.id,
                        poolName: pool.name,
                        deadline: pool.paymentDeadline || 'Sem prazo',
                        amount: myCost,
                        status: 'PENDING'
                    });
                    sumPending += myCost;
                }

                if (myPrizeValue > 0) {
                    myPrizes.push({
                        id: pool.id,
                        poolName: pool.name,
                        drawDate: pool.drawDate,
                        amount: myPrizeValue,
                        status: 'AVAILABLE'
                    });
                    sumPrizes += myPrizeValue;
                }
            }

            setMyPayments(paid.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
            setPendingPayments(pending);
            setPrizes(myPrizes);
            setStats({
                totalPaid: sumPaid,
                totalPending: sumPending,
                totalPrizes: sumPrizes
            });
        }
      } catch (error) {
        console.error("Erro ao carregar financeiro:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const isAdmin = user?.role === 'SAAS_ADMIN' || user?.role === 'POOL_ADMIN';

  if (isAdmin) {
      return (
        <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-slate-900/40">
            <div className="absolute -top-10 -right-10 opacity-10"><Wallet size={200} /></div>
            <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Fundo do Grupo</p>
            <h2 className="text-4xl font-black mb-6">R$ 2.450,00</h2>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Sua Chave PIX Principal</p>
                <p className="text-emerald-400 font-black text-sm">financeiro@lottopool.com.br</p>
            </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 flex flex-col justify-between hover:shadow-lg transition-all">
            <div>
                <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 mb-4"><Clock size={24}/></div>
                <p className="text-slate-500 text-sm font-bold">Cobranças Pendentes</p>
                <h2 className="text-3xl font-black text-slate-800">R$ 480,00</h2>
            </div>
            <div className="flex items-center text-rose-500 text-xs font-black uppercase tracking-wider mt-4">
                <ArrowDownRight size={16} className="mr-1" />
                <span>8 membros em atraso</span>
            </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 flex flex-col justify-between hover:shadow-lg transition-all">
            <div>
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-4"><CheckCircle2 size={24}/></div>
                <p className="text-slate-500 text-sm font-bold">Prêmios Acumulados</p>
                <h2 className="text-3xl font-black text-slate-800">R$ 15.240,00</h2>
            </div>
            <div className="flex items-center text-emerald-600 text-xs font-black uppercase tracking-wider mt-4">
                <ArrowUpRight size={16} className="mr-1" />
                <span>+15% este mês</span>
            </div>
            </div>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm">
            <h3 className="font-bold text-xl mb-8">Fluxo de Caixa Consolidado</h3>
            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={financialData}>
                    <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} className="text-xs font-bold text-slate-400" />
                    <YAxis axisLine={false} tickLine={false} className="text-xs font-bold text-slate-400" />
                    <Tooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} />
                    <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                    <Area type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={2} fill="transparent" strokeDasharray="5 5" />
                </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
        </div>
      );
  }

  // USER VIEW (POOL_MEMBER)
  return (
    <div className="space-y-8">
      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl">
           <div className="absolute -top-6 -right-6 opacity-10"><Wallet size={160} /></div>
           <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Total Pago</p>
           <h2 className="text-3xl font-black text-emerald-400">R$ {stats.totalPaid.toFixed(2)}</h2>
           <p className="text-xs text-slate-500 mt-2 font-medium">Investimento acumulado</p>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 hover:shadow-lg transition-all">
           <div className="flex items-center space-x-4 mb-4">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl"><AlertCircle size={24} /></div>
              <p className="text-slate-500 text-xs font-black uppercase tracking-widest">A Pagar</p>
           </div>
           <h2 className="text-3xl font-black text-slate-800">R$ {stats.totalPending.toFixed(2)}</h2>
           <p className="text-xs text-rose-500 font-bold mt-2">{pendingPayments.length} pagamentos pendentes</p>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 hover:shadow-lg transition-all">
           <div className="flex items-center space-x-4 mb-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><DollarSign size={24} /></div>
              <p className="text-slate-500 text-xs font-black uppercase tracking-widest">Prêmios a Receber</p>
           </div>
           <h2 className="text-3xl font-black text-emerald-600">R$ {stats.totalPrizes.toFixed(2)}</h2>
           <p className="text-xs text-emerald-600 font-bold mt-2">Disponível para saque</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pagamentos Pendentes */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
            <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center">
                <Clock className="mr-2 text-rose-500" size={20} />
                Pagamentos Pendentes
            </h3>
            
            {pendingPayments.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                    <CheckCircle2 size={40} className="mx-auto text-emerald-400 mb-3" />
                    <p className="text-slate-500 font-medium text-sm">Tudo em dia! Você não tem pendências.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {pendingPayments.map((payment, i) => (
                        <div key={i} className="flex items-center justify-between p-4 border border-slate-100 rounded-2xl hover:bg-rose-50/50 transition-colors group">
                            <div>
                                <p className="font-bold text-slate-800">{payment.poolName}</p>
                                <p className="text-xs text-rose-500 font-bold mt-1">Vence: {payment.deadline}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-black text-slate-800">R$ {payment.amount.toFixed(2)}</p>
                                <button className="text-[10px] bg-slate-900 text-white px-3 py-1 rounded-full font-bold uppercase tracking-wide mt-1 hover:bg-emerald-600 transition-colors">
                                    Pagar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* Histórico e Prêmios */}
        <div className="space-y-8">
            {/* Prêmios */}
            {prizes.length > 0 && (
                <div className="bg-emerald-50 rounded-[2.5rem] border border-emerald-100 p-8 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-200/20 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                    <h3 className="font-bold text-lg text-emerald-800 mb-6 flex items-center relative z-10">
                        <DollarSign className="mr-2" size={20} />
                        Prêmios Disponíveis
                    </h3>
                    <div className="space-y-3 relative z-10">
                        {prizes.map((prize, i) => (
                            <div key={i} className="bg-white p-4 rounded-2xl shadow-sm flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-slate-800">{prize.poolName}</p>
                                    <p className="text-xs text-slate-400">{prize.drawDate}</p>
                                </div>
                                <p className="font-black text-emerald-600 text-lg">R$ {prize.amount.toFixed(2)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Histórico Recente */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
                <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center">
                    <Calendar className="mr-2 text-slate-400" size={20} />
                    Histórico de Pagamentos
                </h3>
                <div className="space-y-4">
                    {myPayments.length === 0 ? (
                        <p className="text-slate-400 text-center py-4 text-sm">Nenhum pagamento registrado.</p>
                    ) : (
                        myPayments.slice(0, 5).map((payment, i) => (
                            <div key={i} className="flex items-center justify-between p-3 border-b border-slate-50 last:border-0">
                                <div className="flex items-center">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400 mr-3"></div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-700">{payment.poolName}</p>
                                        <p className="text-[10px] text-slate-400">{new Date(payment.date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <p className="font-bold text-slate-600 text-sm">R$ {payment.amount.toFixed(2)}</p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialDashboard;
