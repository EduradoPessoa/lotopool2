
import React, { useState, useEffect } from 'react';
import { Plus, Search, Users, Wallet, ExternalLink, Edit2, MessageSquare, Share2, X, Loader2, Check, DollarSign } from 'lucide-react';
import { PoolGroup } from '../types';
import { db } from '../services/db';

interface GroupsManagementProps {
  isAdmin?: boolean;
}

const GroupsManagement: React.FC<GroupsManagementProps> = ({ isAdmin = false }) => {
  const [groups, setGroups] = useState<PoolGroup[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    pixKey: '',
    notifActive: true
  });

  const loadGroups = async () => {
    try {
      setIsLoading(true);
      const list = await db.groups.getList();
      setGroups(list);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadGroups(); }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({ name: '', pixKey: '', notifActive: true });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (group: PoolGroup) => {
    setEditingId(group.id);
    setFormData({ 
        name: group.name, 
        pixKey: group.pixKey || '', 
        notifActive: !!group.notifActive 
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    try {
      setIsSaving(true);
      if (editingId) {
        await db.groups.update(editingId, formData);
        setGroups(prev => prev.map(g => g.id === editingId ? { ...g, ...formData } : g));
      } else {
        const result = await db.groups.create({ ...formData, balance: 0, participants: [] });
        setGroups(prev => [result, ...prev]);
      }
      setIsModalOpen(false);
    } catch (e) {
      alert("Erro ao salvar.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = (group: PoolGroup) => {
    const baseUrl = window.location.origin + window.location.pathname;
    const inviteLink = `${baseUrl}#invite=${group.id}`;
    const text = encodeURIComponent(`Olá! 👋 Te convidei para o bolão "${group.name}".\n\nEscolha seu Número da Sorte no link:\n${inviteLink}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const filteredGroups = groups.filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (isLoading) return <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-emerald-500" size={40} /></div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar grupo por nome..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 pr-6 py-4 bg-white border-2 border-slate-100 rounded-2xl w-full sm:w-80 outline-none focus:border-emerald-500 transition-all font-bold shadow-sm"
          />
        </div>
        {isAdmin && (
          <button onClick={handleOpenCreate} className="w-full sm:w-auto flex items-center justify-center space-x-3 bg-emerald-600 text-white px-8 py-4 rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/20 font-black uppercase tracking-widest text-xs">
            <Plus size={20} /> <span>Novo Grupo</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredGroups.map((group) => (
          <div key={group.id} className="bg-white rounded-[3rem] border-2 border-slate-100 p-10 hover:shadow-2xl transition-all group border-b-8 border-b-slate-100 hover:border-b-emerald-500 relative flex flex-col scale-100 hover:scale-[1.03]">
            <div className="flex justify-between items-start mb-8">
              <div className="p-5 bg-slate-50 rounded-[1.5rem] text-slate-700 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-all shadow-inner">
                <Users size={32} />
              </div>
              {isAdmin && (
                <button onClick={() => handleOpenEdit(group)} className="p-3 hover:bg-slate-100 rounded-2xl text-slate-300 hover:text-emerald-600 transition-colors">
                  <Edit2 size={24}/>
                </button>
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">{group.name}</h3>
              <p className="text-[10px] text-slate-400 mb-8 font-black uppercase tracking-widest flex items-center">
                  <Check className="mr-1.5 text-emerald-500" size={14}/> {group.participants?.length || 0} Membros Ativos
              </p>
              
              <div className="space-y-3 mb-10">
                  <div className="bg-slate-50 rounded-2xl p-5 flex justify-between items-center border border-slate-100">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Saldo Fundo</span>
                    <span className="text-xl font-black text-emerald-600 tracking-tight">R$ {group.balance?.toFixed(2) || "0,00"}</span>
                  </div>
                  <div className="bg-emerald-50/30 rounded-2xl p-4 flex items-center space-x-3 border border-emerald-100">
                    <DollarSign size={16} className="text-emerald-600" />
                    <span className="text-[10px] font-bold text-emerald-800 truncate">{group.pixKey || 'PIX não configurado'}</span>
                  </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-600 border-2 border-slate-100 rounded-2xl hover:bg-slate-900 hover:text-white transition-all shadow-sm">Dashboard</button>
              <button onClick={() => handleShare(group)} className="py-4 text-[10px] font-black uppercase tracking-widest text-emerald-700 border-2 border-emerald-100 bg-emerald-50 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm">Link Adesão</button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white p-12 rounded-[3.5rem] w-full max-w-lg shadow-2xl relative animate-in zoom-in-95 duration-300">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-10 right-10 p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"><X size={28} /></button>
            <h2 className="text-3xl font-black mb-10 text-slate-800 tracking-tight">{editingId ? 'Editar Grupo' : 'Novo Grupo'}</h2>
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Nome do Grupo de Bolão</label>
                <input 
                  type="text" required placeholder="Ex: Bolão da Firma 2024" value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] outline-none focus:border-emerald-500 font-bold text-slate-800 shadow-inner"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Chave PIX Oficial (Recebimento)</label>
                <input 
                  type="text" placeholder="CPF, Email, Celular ou Aleatória" value={formData.pixKey}
                  onChange={e => setFormData({...formData, pixKey: e.target.value})}
                  className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] outline-none focus:border-emerald-500 font-bold text-slate-800 shadow-inner"
                />
              </div>

              <div className="flex items-center space-x-4 p-6 bg-emerald-50/50 rounded-[2rem] border-2 border-emerald-100 cursor-pointer group transition-all hover:bg-emerald-50" onClick={() => setFormData({...formData, notifActive: !formData.notifActive})}>
                <div className="p-3 bg-white rounded-2xl shadow-sm text-emerald-600 group-hover:scale-110 transition-transform"><MessageSquare size={24} /></div>
                <div className="flex-1">
                    <p className="font-black text-emerald-900 text-xs uppercase tracking-widest">Automação WhatsApp</p>
                    <p className="text-[10px] text-emerald-600 font-medium">Notificar membros sobre novos bolões.</p>
                </div>
                <input type="checkbox" checked={formData.notifActive} readOnly className="w-6 h-6 rounded-full accent-emerald-600 border-emerald-200" />
              </div>

              <div className="flex space-x-4 pt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 border-2 border-slate-100 rounded-[1.5rem] font-black uppercase tracking-widest text-xs text-slate-400 hover:bg-slate-50 transition-all">Cancelar</button>
                <button type="submit" disabled={isSaving} className="flex-[2] py-5 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs hover:bg-emerald-600 transition-all flex items-center justify-center shadow-xl shadow-slate-900/10 active:scale-95">
                  {isSaving ? <Loader2 className="animate-spin" /> : <><Check size={20} className="mr-2" /> {editingId ? 'Atualizar' : 'Criar Grupo'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupsManagement;
