import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  Trophy, 
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
import { LOTTERY_CONFIGS, User } from '../types';
import { db } from '../services/db';

const COLORS = ['#059669', '#9333ea', '#2563eb', '#f97316'];

interface DashboardProps {
  user?: User | null;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [stats, setStats] = useState([
    { label: 'Total em Prêmios', value: 'R$ 0,00', icon: Trophy, trend: '-', color: 'emerald' },
    { label: 'Investimento Total', value: 'R$ 0,00', icon: TrendingUp, trend: '-', color: 'blue' },
    { label: 'Participantes Ativos', value: '0', icon: Users, trend: '-', color: 'purple' },
    { label: 'Bolões Abertos', value: '0', icon: Clock, trend: '-', color: 'orange' },
  ]);
  const [chartData, setChartData] = useState<any[]>([
      { name: 'Sem dados', value: 0 }
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [allPools, allParticipants] = await Promise.all([
          db.pools.getList(),
          db.participants.getList()
        ]);

        let filteredPools = allPools;
        let participantId: string | undefined;

        if (user?.role === 'POOL_MEMBER') {
            // Find participant ID for the current user
            const me = allParticipants.find(p => p.profileId === user.id || p.email === user.email);
            participantId = me?.id;

            if (participantId) {
                filteredPools = allPools.filter(pool => 
                    pool.participants.some(p => p.participantId === participantId)
                );
            } else {
                filteredPools = [];
            }
        }

        // Calculate Stats
        const openPools = filteredPools.filter(p => p.status === 'OPEN').length;
        
        // Calculate Unique Participants in these pools
        const uniqueParticipants = new Set<string>();
        filteredPools.forEach(pool => {
            pool.participants.forEach(p => uniqueParticipants.add(p.participantId));
        });
        const activeParticipants = uniqueParticipants.size;

        // Calculate Investment (mocked as we don't have full financial history easily)
        let totalInvestment = 0;
        let totalPrizes = 0;

        filteredPools.forEach(pool => {
            totalPrizes += pool.totalPrize || 0;
            totalInvestment += pool.budgetUsed || 0;
        });

        // Chart Data
        const poolsByType: Record<string, number> = {};
        filteredPools.forEach(pool => {
            poolsByType[pool.type] = (poolsByType[pool.type] || 0) + (pool.budgetUsed || 0);
        });

        const newChartData = Object.keys(LOTTERY_CONFIGS).map(type => ({
            name: LOTTERY_CONFIGS[type as keyof typeof LOTTERY_CONFIGS].name,
            value: poolsByType[type] || 0
        })).filter(d => d.value > 0);
        
        setStats([
          { label: 'Total em Prêmios', value: `R$ ${totalPrizes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: Trophy, trend: '-', color: 'emerald' },
          { label: 'Investimento Total', value: `R$ ${totalInvestment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: TrendingUp, trend: '-', color: 'blue' },
          { label: 'Participantes Ativos', value: activeParticipants.toString(), icon: Users, trend: '-', color: 'purple' },
          { label: 'Bolões Abertos', value: openPools.toString(), icon: Clock, trend: '-', color: 'orange' },
        ]);
        
        if (newChartData.length > 0) {
            setChartData(newChartData);
        } else {
             setChartData([{ name: 'Sem dados', value: 0 }]);
        }

      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
        fetchData();
    }
  }, [user]);

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
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
            <p className="text-2xl font-bold text-slate-800">{loading ? '...' : stat.value}</p>
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
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Pools - Próximos Sorteios (Keeping static/config based as it is general info) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-lg mb-6">Próximos Sorteios</h3>
          <div className="space-y-4">
            {Object.entries(LOTTERY_CONFIGS).map(([key, config]) => (
              <div key={key} className="flex items-center p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                <div className={`w-3 h-12 rounded-full ${config.color} mr-4`}></div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800">{config.name}</p>
                  <p className="text-sm text-slate-500">Próximo Concurso</p>
                </div>
                <div className="text-right">
                  <button className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1 rounded-full transition-colors">
                    Ver Mais
                  </button>
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
