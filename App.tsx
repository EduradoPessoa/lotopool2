
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import PoolManagement from './components/PoolManagement';
import MyPools from './components/MyPools';
import GroupsManagement from './components/GroupsManagement';
import ParticipantsManagement from './components/ParticipantsManagement';
import FinancialDashboard from './components/FinancialDashboard';
import JoinInvite from './components/JoinInvite';
import Auth from './components/Auth';
import { UserCircle } from 'lucide-react';
import { User as UserType } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [inviteGroupId, setInviteGroupId] = useState<string | null>(null);

  useEffect(() => {
    const checkInvite = () => {
      let invite = null;

      const searchParams = new URLSearchParams(window.location.search);
      invite = searchParams.get('invite');

      if (!invite && window.location.hash) {
        const hashContent = window.location.hash.substring(1);
        const cleanHash = hashContent.startsWith('/') ? hashContent.substring(1) : hashContent;
        const hashParams = new URLSearchParams(cleanHash);
        invite = hashParams.get('invite');
      }

      if (invite) {
        console.log("Convite detectado para o grupo:", invite);
        setInviteGroupId(invite);
      }
    };

    checkInvite();
    window.addEventListener('hashchange', checkInvite);

    const saved = localStorage.getItem('lotto_user');
    if (saved) setCurrentUser(JSON.parse(saved));

    return () => window.removeEventListener('hashchange', checkInvite);
  }, []);

  const handleLogin = (user: UserType) => {
    setCurrentUser(user);
    localStorage.setItem('lotto_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('lotto_user');
    window.history.replaceState({}, '', window.location.origin + window.location.pathname);
  };

  const handleJoinSuccess = (newUser: UserType) => {
    handleLogin(newUser);
    window.history.replaceState({}, '', window.location.origin + window.location.pathname);
    setInviteGroupId(null);
    setActiveTab('dashboard');
  };

  if (inviteGroupId && !currentUser) {
    return <JoinInvite groupId={inviteGroupId} onSuccess={handleJoinSuccess} />;
  }

  if (!currentUser) {
    return <Auth onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'my-pools': return <MyPools user={currentUser} />;
      case 'groups': return <GroupsManagement isAdmin={currentUser.role === 'ADMIN'} />;
      case 'pools': return <PoolManagement isAdmin={currentUser.role === 'ADMIN'} currentUser={currentUser} />;
      case 'participants': return <ParticipantsManagement isAdmin={currentUser.role === 'ADMIN'} />;
      case 'tickets':
        return (
          <div className="bg-white p-12 rounded-3xl border-2 border-dashed border-slate-200 text-center max-w-2xl mx-auto mt-12">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <UserCircle className="text-slate-300" size={40} />
             </div>
             <h3 className="text-xl font-bold text-slate-800 mb-2">Visualização de Volantes</h3>
             <p className="text-slate-500 mb-8 max-w-sm mx-auto">
               {currentUser.role === 'ADMIN' 
                ? 'Digitalize e vincule os comprovantes físicos aos jogos para garantir a transparência do bolão.' 
                : 'Confira aqui os comprovantes oficiais anexados pela administração para validar suas apostas.'}
             </p>
             {currentUser.role === 'ADMIN' && (
               <button className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-bold shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all hover:scale-[1.02]">Registrar Comprovante</button>
             )}
          </div>
        );
      case 'financial': return <FinancialDashboard />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} user={currentUser} onLogout={handleLogout}>
      <div className="animate-in fade-in duration-500">
        {renderContent()}
      </div>
    </Layout>
  );
};

export default App;
