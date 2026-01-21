
import React from 'react';
import { Wallet, ArrowUpRight, ArrowDownRight, CreditCard, Clock, CheckCircle2 } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

const financialData = [
  { month: 'Set', revenue: 400, expense: 200 },
  { month: 'Out', revenue: 600, expense: 400 },
  { month: 'Nov', revenue: 500, expense: 300 },
  { month: 'Dez', revenue: 1500, expense: 800 },
  { month: 'Jan', revenue: 1100, expense: 600 },
  { month: 'Fev', revenue: 2400, expense: 1200 },
];

const FinancialDashboard: React.FC = () => {
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
};

export default FinancialDashboard;
