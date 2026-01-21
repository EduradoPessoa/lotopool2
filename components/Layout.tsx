
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Ticket, 
  Wallet, 
  Settings, 
  Menu, 
  X, 
  Trophy,
  Bell,
  Layers,
  LogOut,
  UserCheck,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import NotificationCenter from './NotificationCenter';
import { AppNotification, User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: User;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, user, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  
  const [notifications, setNotifications] = useState<AppNotification[]>([
    {
      id: '1',
      type: 'RESULT',
      title: 'Resultado Mega-Sena!',
      message: 'O sorteio do concurso 2810 foi realizado. O Bolão da Firma teve 4 acertos!',
      timestamp: 'Há 5 min',
      read: false
    },
    {
      id: '2',
      type: 'DEADLINE',
      title: 'Encerramento Próximo',
      message: 'Apostas para a Lotofácil Especial encerram em 2 horas. Garanta sua cota!',
      timestamp: 'Há 1 hora',
      read: false
    }
  ]);

  // Fechar menu mobile ao mudar de aba
  useEffect(() => {
    setIsMobileOpen(false);
  }, [activeTab]);

  const navItems = [
    { id: 'dashboard', label: 'Início', icon: LayoutDashboard, allowedRoles: ['SAAS_ADMIN', 'POOL_ADMIN', 'POOL_MEMBER'] },
    { id: 'my-pools', label: 'Minhas Cotas', icon: UserCheck, allowedRoles: ['SAAS_ADMIN', 'POOL_ADMIN', 'POOL_MEMBER'] },
    { id: 'groups', label: 'Grupos', icon: Layers, allowedRoles: ['SAAS_ADMIN', 'POOL_ADMIN', 'POOL_MEMBER'] },
    { id: 'pools', label: 'Bolões', icon: Trophy, allowedRoles: ['SAAS_ADMIN', 'POOL_ADMIN', 'POOL_MEMBER'] },
    { id: 'participants', label: 'Membros', icon: Users, allowedRoles: ['SAAS_ADMIN', 'POOL_ADMIN'] },
    { id: 'tickets', label: 'Comprovantes', icon: Ticket, allowedRoles: ['SAAS_ADMIN', 'POOL_ADMIN', 'POOL_MEMBER'] },
    { id: 'financial', label: 'Financeiro', icon: Wallet, allowedRoles: ['SAAS_ADMIN', 'POOL_ADMIN', 'POOL_MEMBER'] },
  ].filter(item => item.allowedRoles.includes(user.role));

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleClearAll = () => {
    setNotifications([]);
    setIsNotifOpen(false);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-inter">
      {/* Overlay para Mobile */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Principal */}
      <aside className={`
        fixed inset-y-0 left-0 z-[70] bg-slate-900 text-white transition-all duration-300 ease-in-out flex flex-col
        lg:relative
        ${isSidebarOpen ? 'w-64' : 'w-20'}
        ${isMobileOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header da Sidebar */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-white/5">
          <div className={`flex items-center space-x-3 transition-all duration-300 ${!isSidebarOpen && 'lg:opacity-0 lg:scale-0'}`}>
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Trophy size={18} className="text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight whitespace-nowrap">
              LottoPool<span className="text-emerald-500">Master</span>
            </span>
          </div>
          
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="hidden lg:flex p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
          >
            {isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>

          <button 
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-1.5 hover:bg-slate-800 rounded-lg text-slate-400"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navegação */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`
                  w-full flex items-center p-3.5 rounded-xl transition-all relative group
                  ${isActive ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : 'hover:bg-white/5 text-slate-400 hover:text-white'}
                `}
              >
                <item.icon size={22} className={`shrink-0 ${isSidebarOpen ? 'mr-4' : 'mx-auto'}`} />
                
                <span className={`
                  font-medium whitespace-nowrap transition-all duration-300
                  ${isSidebarOpen ? 'opacity-100 translate-x-0' : 'lg:opacity-0 lg:-translate-x-4 absolute'}
                  ${!isSidebarOpen && 'lg:group-hover:opacity-100 lg:group-hover:translate-x-12 lg:group-hover:bg-slate-800 lg:group-hover:px-4 lg:group-hover:py-2 lg:group-hover:rounded-lg lg:group-hover:z-50'}
                `}>
                  {item.label}
                </span>

                {isActive && !isSidebarOpen && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-400 rounded-l-full hidden lg:block" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Rodapé da Sidebar */}
        <div className="p-3 border-t border-white/5 space-y-1">
          <button className="w-full flex items-center p-3.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all">
            <Settings size={22} className={isSidebarOpen ? 'mr-4' : 'mx-auto'} />
            <span className={`font-medium transition-all duration-300 ${isSidebarOpen ? 'opacity-100' : 'lg:opacity-0 lg:hidden'}`}>Configurações</span>
          </button>
          
          <button 
            onClick={onLogout}
            className="w-full flex items-center p-3.5 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all"
          >
            <LogOut size={22} className={isSidebarOpen ? 'mr-4' : 'mx-auto'} />
            <span className={`font-medium transition-all duration-300 ${isSidebarOpen ? 'opacity-100' : 'lg:opacity-0 lg:hidden'}`}>Sair</span>
          </button>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 overflow-y-auto flex flex-col relative">
        <header className="bg-white border-b border-slate-200 px-6 lg:px-8 h-20 flex justify-between items-center sticky top-0 z-40 shrink-0">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-100 rounded-xl text-slate-600"
            >
              <Menu size={24} />
            </button>
            
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-slate-800">
                {navItems.find(i => i.id === activeTab)?.label}
              </h1>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest leading-tight">
                {user.role === 'SAAS_ADMIN' || user.role === 'POOL_ADMIN' ? 'Modo Administrativo' : 'Área do Participante'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 lg:space-x-6">
             <div className="hidden md:flex bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full text-sm font-bold border border-emerald-100 items-center">
                <Wallet size={14} className="mr-2" />
                R$ 2.450,00
             </div>
             
             <div className="relative">
                <button 
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className={`p-2.5 rounded-xl border transition-all relative ${isNotifOpen ? 'bg-slate-100 border-slate-300' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                >
                  <Bell size={20} className="text-slate-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>
                
                {isNotifOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)} />
                    <NotificationCenter 
                      notifications={notifications} 
                      onMarkAsRead={handleMarkAsRead}
                      onClearAll={handleClearAll}
                    />
                  </>
                )}
             </div>

             <div className="flex items-center space-x-3 group cursor-pointer pl-2 lg:pl-0 border-l border-slate-100 lg:border-none">
                <div className="text-right hidden sm:block">
                   <p className="text-sm font-bold text-slate-800 leading-none group-hover:text-emerald-600 transition-colors">{user.name}</p>
                   <p className="text-[10px] text-slate-400 font-medium capitalize mt-1">{user.role.toLowerCase()}</p>
                </div>
                <img 
                  src={`https://ui-avatars.com/api/?name=${user.name}&background=10b981&color=fff&bold=true`} 
                  className="w-10 h-10 rounded-xl border-2 border-slate-200 shadow-sm group-hover:border-emerald-500 transition-all" 
                  alt="Avatar" 
                />
             </div>
          </div>
        </header>

        <div className="p-4 lg:p-8 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
