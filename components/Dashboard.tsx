
import React from 'react';
import { 
  TrendingUp, 
  Users, 
  Trophy, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { LOTTERY_CONFIGS } from '../types';

const data = [
  { name: 'Mega-Sena', value: 1200 },
  { name: 'Lotofácil', value: 850 },
  { name: 'Quina', value: 400 },
  { name: '+Milionária', value: 300 },
];

const COLORS = ['#059669', '#9333ea', '#2563eb', '#f97316'];

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total em Prêmios', value: 'R$ 15.240,00', icon: Trophy, trend: '+12%', color: 'emerald' },
          { label: 'Investimento Total', value: 'R$ 3.840,00', icon: TrendingUp, trend: '+5%', color: 'blue' },
          { label: 'Participantes Ativos', value: '24', icon: Users, trend: '+2', color: 'purple' },
          { label: 'Bolões Abertos', value: '3', icon: Clock, trend: 'Estável', color: 'orange' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl bg-${stat.color}-50 text-${stat.color}-600`}>
                <stat.icon size={24} />
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${stat.trend.includes('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-500'}`}>
                {stat.trend}
              </span>
            </div>
            <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
            <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg">Investimento por Loteria</h3>
            <button className="text-sm text-emerald-600 font-semibold hover:underline">Ver Detalhes</button>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Pools */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-lg mb-6">Próximos Sorteios</h3>
          <div className="space-y-4">
            {Object.entries(LOTTERY_CONFIGS).map(([key, config]) => (
              <div key={key} className="flex items-center p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                <div className={`w-3 h-12 rounded-full ${config.color} mr-4`}></div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800">{config.name}</p>
                  <p className="text-sm text-slate-500">Conc. 2785 • Amanhã</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-800">R$ 45 Mi</p>
                  <p className="text-xs text-slate-400">Estimado</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-3 border-2 border-slate-100 rounded-xl text-slate-600 font-semibold hover:bg-slate-50 transition-colors">
            Ver Todos
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
