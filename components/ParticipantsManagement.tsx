
import React, { useState, useEffect } from 'react';
import { Plus, Search, Phone, Mail, User, Edit2, X, Loader2, Check } from 'lucide-react';
import { Participant } from '../types';
import { db } from '../services/db';

interface ParticipantsManagementProps {
  isAdmin?: boolean;
}

const ParticipantsManagement: React.FC<ParticipantsManagementProps> = ({ isAdmin = false }) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: ''
  });

  const loadParticipants = async () => {
    try {
      setIsLoading(true);
      const list = await db.participants.getList();
      setParticipants(list);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { loadParticipants(); }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({ name: '', phone: '', email: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Participant) => {
    setEditingId(p.id);
    setFormData({ name: p.name, phone: p.phone, email: p.email });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      if (editingId) {
        await db.participants.update(editingId, formData);
        setParticipants(prev => prev.map(p => p.id === editingId ? { ...p, ...formData } : p));
      } else {
        const result = await db.participants.create(formData);
        setParticipants(prev => [...prev, result]);
      }
      setIsModalOpen(false);
    } catch (e) { alert("Erro ao salvar."); }
    finally { setIsSaving(false); }
  };

  const filtered = participants.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (isLoading) return <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-emerald-500" size={40} /></div>;

  return (
    <div className="space-y-6 text-left">
      <div className="flex justify-between items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" placeholder="Buscar membro..." value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-500 w-64 font-medium"
          />
        </div>
        {isAdmin && (
          <button onClick={handleOpenCreate} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold flex items-center space-x-2 hover:bg-slate-800 transition-all">
            <Plus size={20} /> <span>Novo Membro</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((p) => (
          <div key={p.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4 hover:shadow-md transition-all group relative">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xl uppercase">
              {p.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-slate-800 truncate">{p.name}</h4>
              <div className="text-xs text-slate-400 space-y-1 mt-1 font-medium">
                <div className="flex items-center"><Phone size={12} className="mr-1.5 opacity-60"/> {p.phone}</div>
                <div className="flex items-center"><Mail size={12} className="mr-1.5 opacity-60"/> {p.email}</div>
              </div>
            </div>
            {isAdmin && (
              <button onClick={() => handleOpenEdit(p)} className="p-2 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-emerald-600 transition-all">
                <Edit2 size={18} />
              </button>
            )}
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white p-10 rounded-[2.5rem] w-full max-w-md animate-in zoom-in-95 relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-600"><X size={24} /></button>
            <h2 className="text-2xl font-bold mb-8 text-slate-800">{editingId ? 'Editar Membro' : 'Novo Membro'}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Nome Completo</label>
                <input 
                  type="text" required value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500 font-medium"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">WhatsApp</label>
                  <input 
                    type="text" required value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500 font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">E-mail</label>
                  <input 
                    type="email" required value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500 font-medium"
                  />
                </div>
              </div>
              <div className="flex space-x-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 border-2 border-slate-100 rounded-2xl font-bold text-slate-500">Cancelar</button>
                <button type="submit" disabled={isSaving} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 flex items-center justify-center">
                  {isSaving ? <Loader2 className="animate-spin" /> : 'Salvar Membro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParticipantsManagement;
