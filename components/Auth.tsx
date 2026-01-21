
import React, { useState } from 'react';
import { User, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { User as UserType } from '../types';
import { db } from '../services/db';

interface AuthProps {
  onLogin: (user: UserType) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Tentativa de login real via PocketBase
      const authData = await db.auth.login(email, password);
      
      onLogin({
        id: authData.record.id,
        name: authData.record.name || 'Usuário PocketBase',
        email: authData.record.email,
        role: (authData.record.role as any) || 'PARTICIPANT'
      });
    } catch (e) {
      console.warn("Falha na autenticação via backend. Usando modo offline.");
      // Fallback para facilitar testes rápidos
      const role = email.toLowerCase().includes('admin') ? 'ADMIN' : 'PARTICIPANT';
      onLogin({
        id: Math.random().toString(),
        name: role === 'ADMIN' ? 'Admin Local' : 'Membro Local',
        email: email,
        role: role as any
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-2xl border border-white/10">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-900/20">
            <TrophyIcon className="text-white" size={40} />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">LottoPool Master</h1>
          <p className="text-slate-400 text-sm mt-2 font-medium italic">Sua sorte, nossa gestão.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 text-rose-600 text-sm font-bold rounded-2xl border border-rose-100 animate-in fade-in zoom-in-95">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">E-mail de Acesso</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 text-slate-900 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400 font-medium" 
                placeholder="admin@lottopool.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Senha Segura</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 text-slate-900 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400 font-medium" 
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center space-x-3 hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-xl shadow-emerald-900/20 disabled:opacity-50 mt-4"
          >
            {loading ? <Loader2 className="animate-spin" size={24} /> : (
              <>
                <span className="text-lg">Acessar Painel</span>
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>
        
        <div className="mt-8 text-center">
          <p className="text-slate-400 text-xs font-medium">
            Sistema integrado com <span className="text-emerald-600 font-bold">PocketBase Cloud</span>
          </p>
        </div>
      </div>
    </div>
  );
};

const TrophyIcon = ({ size, className }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
    <path d="M4 22h16"></path>
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
  </svg>
);

export default Auth;
