
import React, { useState, useEffect } from 'react';
import { User, Phone, Check, Loader2, Trophy, ArrowRight, CreditCard, ShieldCheck, Hash } from 'lucide-react';
import { db } from '../services/db';
import { PoolGroup, User as UserType, LOTTERY_CONFIGS } from '../types';

interface JoinInviteProps {
  groupId: string;
  onSuccess: (user: UserType) => void;
}

const JoinInvite: React.FC<JoinInviteProps> = ({ groupId, onSuccess }) => {
  const STORAGE_KEY = `lottopool_invite_progress_${groupId}`;

  const [group, setGroup] = useState<PoolGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Persisted state initialization
  const [step, setStep] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return typeof parsed.step === 'number' ? parsed.step : 1;
      } catch (e) { return 1; }
    }
    return 1;
  });

  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const defaultData = { 
      name: '', 
      phone: '', 
      email: '', 
      cpf: '', 
      pixKey: '', 
      luckyNumber: 0,
      acceptedTerms: false 
    };

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.formData || defaultData;
      } catch (e) { return defaultData; }
    }
    return defaultData;
  });

  // Save progress to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ step, formData }));
  }, [step, formData, groupId]);

  useEffect(() => {
    const fetchGroup = async () => {
      const data = await db.groups.getOne(groupId);
      setGroup(data);
      setLoading(false);
    };
    fetchGroup();
  }, [groupId]);

  const validateStep = () => {
    setError(null);
    if (step === 1) {
      if (!formData.name || !formData.phone || !formData.email || !formData.cpf) {
        setError("Todos os campos de identificação são obrigatórios.");
        return false;
      }
      // Simulação de validação de CPF único
      const existing = localStorage.getItem(`cpf_${formData.cpf}`);
      if (existing) {
        setError("Este CPF já possui cadastro no sistema.");
        return false;
      }
    }
    if (step === 2 && !formData.pixKey) {
      setError("A chave PIX é necessária para recebimento de prêmios.");
      return false;
    }
    if (step === 3 && (formData.luckyNumber <= 0 || formData.luckyNumber > 60)) {
      setError("Escolha um número válido.");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) setStep(s => s + 1);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.acceptedTerms) {
      setError("Você precisa aceitar os termos de uso.");
      return;
    }

    try {
      setIsJoining(true);
      // Salva CPF para simular unicidade no mock
      localStorage.setItem(`cpf_${formData.cpf}`, 'true');

      const newParticipant = await db.participants.create(formData);
      await db.groups.addParticipant(groupId, newParticipant.id, formData.luckyNumber);
      
      const userSession: UserType = {
        id: newParticipant.id,
        name: newParticipant.name,
        email: newParticipant.email,
        role: 'PARTICIPANT',
        cpf: formData.cpf,
        pixKey: formData.pixKey
      };

      // Clear persistence on success
      localStorage.removeItem(STORAGE_KEY);
      onSuccess(userSession);
    } catch (e) {
      setError("Erro ao processar sua adesão.");
    } finally {
      setIsJoining(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <Loader2 className="animate-spin text-emerald-500" size={48} />
    </div>
  );

  if (!group) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white p-6 text-center">
      <div className="animate-in fade-in duration-700">
        <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-500 border border-white/5">
          <Trophy size={40} />
        </div>
        <h1 className="text-3xl font-bold mb-3 tracking-tight">Ops! Convite Expirado</h1>
        <p className="text-slate-400 max-w-sm mx-auto">Este link de convite não é mais válido ou o grupo foi desativado.</p>
        <button onClick={() => window.location.href = window.location.origin} className="mt-10 bg-white/10 px-8 py-3 rounded-2xl font-bold hover:bg-white/20 transition-all">Voltar ao Início</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 selection:bg-emerald-500/30">
      <div className="max-w-md w-full bg-white rounded-[3rem] p-10 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-500">
        {/* Progress bar */}
        <div className="absolute top-0 left-0 w-full h-2 bg-slate-100 flex">
           <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${(step/4)*100}%` }} />
        </div>

        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/20">
            <Trophy size={32} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Adesão ao Bolão</h1>
          <p className="text-slate-500 text-sm mt-2">Você foi convidado para: <br/><span className="text-emerald-600 font-black uppercase">{group.name}</span></p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs font-bold animate-in slide-in-from-top-2">
            {error}
          </div>
        )}

        <div className="min-h-[300px]">
          {step === 1 && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <h3 className="font-bold text-slate-800 flex items-center"><User size={18} className="mr-2 text-emerald-500"/> Identificação</h3>
              <input type="text" placeholder="Nome Completo" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500 font-medium" />
              <input type="email" placeholder="E-mail" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500 font-medium" />
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="WhatsApp" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500 font-medium" />
                <input type="text" placeholder="CPF" value={formData.cpf} onChange={e => setFormData({...formData, cpf: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500 font-medium" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <h3 className="font-bold text-slate-800 flex items-center"><CreditCard size={18} className="mr-2 text-emerald-500"/> Dados Financeiros</h3>
              <p className="text-xs text-slate-400 font-medium">Sua chave PIX será usada para transferências automáticas de prêmios conquistados pelo grupo.</p>
              <input type="text" placeholder="Chave PIX (CPF, Email, Celular ou Aleatória)" value={formData.pixKey} onChange={e => setFormData({...formData, pixKey: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500 font-medium" />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-800 flex items-center"><Hash size={18} className="mr-2 text-emerald-500"/> Número da Sorte</h3>
                <span className="text-[10px] font-black bg-slate-100 px-2 py-1 rounded-md text-slate-500">ÚNICO POR GRUPO</span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Escolha seu número de identificação exclusivo neste bolão (1 a 60).</p>
              <div className="grid grid-cols-5 gap-2 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                {Array.from({ length: 60 }, (_, i) => i + 1).map(n => {
                  const isTaken = group.participants.some(p => p.luckyNumber === n);
                  const isSelected = formData.luckyNumber === n;
                  return (
                    <button
                      key={n}
                      disabled={isTaken}
                      onClick={() => setFormData({...formData, luckyNumber: n})}
                      className={`
                        aspect-square flex items-center justify-center rounded-xl text-xs font-bold transition-all
                        ${isSelected ? 'bg-emerald-600 text-white shadow-lg' : isTaken ? 'bg-slate-50 text-slate-200 cursor-not-allowed opacity-50' : 'bg-white border-2 border-slate-100 text-slate-600 hover:border-emerald-300'}
                      `}
                    >
                      {n.toString().padStart(2, '0')}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <h3 className="font-bold text-slate-800 flex items-center"><ShieldCheck size={18} className="mr-2 text-emerald-500"/> Termos e Condições</h3>
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-[11px] text-slate-500 space-y-3 h-48 overflow-y-auto leading-relaxed custom-scrollbar">
                <p><strong>1. Gestão de Apostas:</strong> O administrador do grupo tem total autonomia para gerir os recursos financeiros para realização de apostas oficiais.</p>
                <p><strong>2. Divisão de Prêmios:</strong> Prêmios líquidos serão divididos proporcionalmente às cotas adquiridas por cada membro, descontando-se taxas operacionais.</p>
                <p><strong>3. Responsabilidade:</strong> Este sistema é uma ferramenta de auxílio à gestão. A validade jurídica das apostas depende do registro oficial em lotéricas da Caixa.</p>
                <p><strong>4. Privacidade:</strong> Seus dados financeiros são usados exclusivamente para repasse de prêmios e identificação interna do grupo.</p>
              </div>
              <label className="flex items-start space-x-3 cursor-pointer group">
                <input type="checkbox" checked={formData.acceptedTerms} onChange={e => setFormData({...formData, acceptedTerms: e.target.checked})} className="mt-1 w-5 h-5 accent-emerald-600" />
                <span className="text-xs font-bold text-slate-700 leading-tight group-hover:text-emerald-600 transition-colors">Eu li e aceito todos os Termos de Uso e Condições de Participação do bolão.</span>
              </label>
            </div>
          )}
        </div>

        <div className="mt-10 flex space-x-4">
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)} className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-2xl font-bold hover:bg-slate-100 transition-all">Voltar</button>
          )}
          <button 
            onClick={step < 4 ? handleNext : handleJoin}
            disabled={isJoining}
            className="flex-[2] bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center space-x-3 hover:bg-emerald-600 active:scale-95 transition-all shadow-xl shadow-slate-900/10"
          >
            {isJoining ? <Loader2 className="animate-spin" /> : (
              <>
                <span className="text-lg">{step === 4 ? 'Concluir Cadastro' : 'Próximo Passo'}</span>
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinInvite;
