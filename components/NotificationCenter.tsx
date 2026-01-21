
import React from 'react';
import { Bell, Trophy, Clock, CreditCard, Info, CheckCircle2 } from 'lucide-react';
import { AppNotification } from '../types';

interface NotificationCenterProps {
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ 
  notifications, 
  onMarkAsRead,
  onClearAll 
}) => {
  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'RESULT': return <Trophy className="text-amber-500" size={18} />;
      case 'DEADLINE': return <Clock className="text-rose-500" size={18} />;
      case 'FINANCIAL': return <CreditCard className="text-emerald-500" size={18} />;
      default: return <Info className="text-blue-500" size={18} />;
    }
  };

  return (
    <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <div>
          <h3 className="font-bold text-slate-800">Notificações</h3>
          <p className="text-xs text-slate-500">{unreadCount} mensagens não lidas</p>
        </div>
        <button 
          onClick={onClearAll}
          className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
        >
          Limpar tudo
        </button>
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <Bell size={32} className="mx-auto mb-2 opacity-20" />
            <p className="text-sm font-medium">Tudo limpo por aqui!</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div 
              key={notif.id}
              onClick={() => onMarkAsRead(notif.id)}
              className={`p-4 border-b border-slate-50 cursor-pointer transition-colors hover:bg-slate-50 relative ${!notif.read ? 'bg-blue-50/30' : ''}`}
            >
              {!notif.read && <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full" />}
              <div className="flex space-x-3">
                <div className="flex-shrink-0 mt-1">
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-bold text-slate-800 truncate pr-2">{notif.title}</h4>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">{notif.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                    {notif.message}
                  </p>
                  {!notif.read && (
                    <button className="mt-2 text-[10px] font-bold text-emerald-600 flex items-center">
                      <CheckCircle2 size={10} className="mr-1" />
                      Marcar como lida
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
        <button className="text-xs font-bold text-slate-500 hover:text-slate-800">
          Ver todas as atividades
        </button>
      </div>
    </div>
  );
};

export default NotificationCenter;
