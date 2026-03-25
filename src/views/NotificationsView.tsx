import { useState } from 'react';
import { Bell, CheckCircle, Info, AlertTriangle, Clock, Search } from 'lucide-react';
import { AppNotification } from '../types';
import { PageHeader } from '../components/PageHeader';
import { cn } from '../utils';

interface NotificationsViewProps {
  notifications: AppNotification[];
  onMarkAllRead: () => void;
}

export const NotificationsView = ({ notifications, onMarkAllRead }: NotificationsViewProps) => {
  const [selectedNoti, setSelectedNoti] = useState<AppNotification | null>(
    notifications.length > 0 ? notifications[0] : null
  );
  const [searchTerm, setSearchTerm] = useState('');

  const filteredNotifications = notifications.filter(n => 
    n.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="text-emerald-500" size={20} />;
      case 'warning': return <AlertTriangle className="text-amber-500" size={20} />;
      default: return <Info className="text-indigo-500" size={20} />;
    }
  };

  return (
    <div className="h-full flex flex-col pb-20 lg:pb-0">
      <PageHeader title="Notifications">
        <button 
          onClick={onMarkAllRead}
          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm font-medium flex items-center gap-2"
        >
          <CheckCircle size={16} />
          Mark all as read
        </button>
      </PageHeader>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
        {/* Left Pane: List */}
        <div className="lg:col-span-1 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search notifications..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm text-slate-900 dark:text-white"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto no-scrollbar">
            {filteredNotifications.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredNotifications.map(noti => (
                  <button
                    key={noti.id}
                    onClick={() => setSelectedNoti(noti)}
                    className={cn(
                      "w-full text-left p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50",
                      selectedNoti?.id === noti.id ? "bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-500" : "border-l-4 border-transparent",
                      noti.isRead ? "opacity-70" : "bg-white dark:bg-slate-900"
                    )}
                  >
                    <div className="flex gap-3">
                      <div className="shrink-0 mt-1">
                        {getIcon(noti.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm truncate",
                          !noti.isRead ? "font-bold text-slate-900 dark:text-white" : "font-medium text-slate-700 dark:text-slate-300"
                        )}>
                          {noti.message}
                        </p>
                        <div className="flex items-center gap-1 mt-1 text-xs text-slate-500 dark:text-slate-400">
                          <Clock size={12} />
                          {new Date(noti.timestamp).toLocaleString(undefined, {
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </div>
                      </div>
                      {!noti.isRead && (
                        <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-2"></div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center h-full">
                <Bell className="mb-3 opacity-20" size={48} />
                <p className="text-sm">No notifications found</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Details */}
        <div className={cn(
          "lg:col-span-2 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden",
          selectedNoti ? "fixed inset-4 z-50 lg:static lg:inset-auto" : "hidden lg:flex"
        )}>
          {selectedNoti ? (
            <div className="p-8 flex flex-col h-full">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                  {getIcon(selectedNoti.type)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Notification Details</h2>
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mt-1">
                    <Clock size={14} />
                    {new Date(selectedNoti.timestamp).toLocaleString(undefined, {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-100 dark:border-slate-800">
                <p className="text-slate-700 dark:text-slate-300 text-lg leading-relaxed">
                  {selectedNoti.message}
                </p>
              </div>
              
              <div className="mt-auto pt-6 flex justify-end">
                <button 
                  onClick={() => setSelectedNoti(null)}
                  className="px-4 py-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                >
                  Close Details
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <Bell className="mb-4 opacity-20" size={64} />
              <p className="text-lg font-medium">Select a notification to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
