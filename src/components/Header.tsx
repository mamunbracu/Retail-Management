import { useState } from 'react';
import { Menu, Bell, Sun, Moon, User, RefreshCw, X } from 'lucide-react';
import { AppNotification, AppSettings } from '../types';
import { cn } from '../utils';
import { motion, AnimatePresence } from 'motion/react';

interface HeaderProps {
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
  setIsMobileOpen: (open: boolean) => void;
  notifications: AppNotification[];
  onMarkAllRead: () => void;
  onReload: () => void;
  onProfileClick: () => void;
  appSettings: AppSettings | null;
}

export const Header = ({ isDarkMode, setIsDarkMode, setIsMobileOpen, notifications, onMarkAllRead, onReload, onProfileClick, appSettings }: HeaderProps) => {
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const [isNotiOpen, setIsNotiOpen] = useState(false);

  const toggleNoti = () => {
    setIsNotiOpen(!isNotiOpen);
    if (unreadCount > 0) {
      onMarkAllRead();
    }
  };

  return (
    <>
      {/* Notification Popup */}
      <AnimatePresence>
        {isNotiOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNotiOpen(false)}
              className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="fixed top-20 right-4 z-[101] w-80 glass-card p-4"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-800 dark:text-white">Notifications</h3>
                <button onClick={() => setIsNotiOpen(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400">
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-sm text-slate-500 italic">No notifications</p>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className={cn("p-3 rounded-xl text-sm", n.isRead ? "bg-slate-50 dark:bg-slate-800" : "bg-indigo-50 dark:bg-indigo-900/20")}>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{n.message}</p>
                      <p className="text-xs text-slate-500">{new Date(n.timestamp).toLocaleString()}</p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Header */}
      <div className="flex items-center justify-between p-4 lg:p-6 bg-[#0B0F19] border-b border-[#1E293B] sticky top-0 z-40">
        <div className="flex-1 flex items-center gap-4 min-w-0">
          <button onClick={() => setIsMobileOpen(true)} className="p-2 bg-slate-800 rounded-xl shadow-sm lg:hidden shrink-0">
            <Menu size={24} className="text-slate-300" />
          </button>
          <div id="page-header-portal" className="flex-1 flex items-center gap-4 min-w-0">
            {/* PageHeader will portal here */}
            {!document.getElementById('page-header-portal')?.hasChildNodes() && appSettings && (
              <h2 className="text-xl font-bold text-white truncate uppercase">
                {appSettings.siteTitle}
              </h2>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3 sm:gap-4 ml-4 shrink-0">
          <button 
            className="p-2 sm:p-3 bg-slate-800 text-slate-300 rounded-full shadow-sm hover:shadow-md transition-all" 
            onClick={onReload}
          >
            <RefreshCw size={20} />
          </button>
          <button 
            className="p-2 sm:p-3 bg-slate-800 text-slate-300 rounded-full shadow-sm hover:shadow-md transition-all" 
            onClick={() => setIsDarkMode(!isDarkMode)}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <div className="relative">
            <button 
              className="p-2 sm:p-3 bg-slate-800 text-slate-300 rounded-full shadow-sm hover:shadow-md transition-all relative" 
              onClick={toggleNoti}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-primary rounded-full border-2 border-[#0B0F19]"></span>
              )}
            </button>
          </div>
          <button 
            className="p-2 sm:p-3 bg-slate-800 text-slate-300 rounded-full shadow-sm hover:shadow-md transition-all" 
            onClick={onProfileClick}
          >
            <User size={20} />
          </button>
        </div>
      </div>
    </>
  );
};
