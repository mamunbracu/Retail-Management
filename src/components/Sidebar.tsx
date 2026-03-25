import { X, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils';
import { ViewType, AppSettings } from '../types';
import * as LucideIcons from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const SidebarItem: React.FC<{ 
  icon: any, label: string, active: boolean, onClick: () => void 
}> = ({ 
  icon: Icon, label, active, onClick 
}) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 px-4 py-3 w-full text-left transition-all duration-200 rounded-lg",
      active 
        ? "bg-primary text-white shadow-lg shadow-primary/30" 
        : "text-slate-400 hover:bg-primary/10 hover:text-primary"
    )}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </button>
);

interface SidebarProps {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (isOpen: boolean) => void;
  isDarkMode: boolean;
  appSettings: AppSettings | null;
}

export const Sidebar = ({ activeView, setActiveView, isMobileOpen, setIsMobileOpen, isDarkMode, appSettings }: SidebarProps) => {
  const { user, logout, isAdmin } = useAuth();

  const getIcon = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName] || LucideIcons.HelpCircle;
    return Icon;
  };

  const navItems = appSettings ? 
    appSettings.sidebarItems
      .filter(item => item.isVisible && (isAdmin || item.view !== 'Admin Hub'))
      .sort((a, b) => a.order - b.order)
      .map(item => ({
        icon: getIcon(item.icon),
        label: item.label,
        value: item.view
      })) : [
    { icon: LucideIcons.LayoutDashboard, label: 'Dashboard', value: 'Dashboard' },
    ...[
      { icon: LucideIcons.BarChart3, label: 'Analytics', value: 'Analytics' },
      { icon: LucideIcons.ShieldCheck, label: 'Admin Hub', value: 'Admin Hub' },
      { icon: LucideIcons.BookOpen, label: 'Instruction', value: 'Instruction' },
      { icon: LucideIcons.ShoppingCart, label: 'Order List', value: 'Order List' },
      { icon: LucideIcons.ShieldCheck, label: 'Resources', value: 'Resources' },
      { icon: LucideIcons.ClipboardList, label: 'Roster', value: 'Roster' },
      { icon: LucideIcons.Package, label: 'Shift Task', value: 'Shift Task' },
      { icon: LucideIcons.FileText, label: 'Documents', value: 'Documents' },
      { icon: LucideIcons.FileText, label: 'My Timesheet', value: 'Staff Timesheet' },
    ].filter(item => isAdmin || (item.value !== 'Admin Hub')).sort((a, b) => a.label.localeCompare(b.label))
  ];

  const bottomItems = [
    { icon: LucideIcons.User, label: 'Profile', value: 'Profile' },
  ];

  const SiteIcon = appSettings ? getIcon(appSettings.siteIcon) : LucideIcons.LayoutDashboard;
  const siteTitle = appSettings?.siteTitle || 'FIRESTATION';
  const siteSubtitle = siteTitle === 'FIRESTATION' ? 'Newsagency' : '';

  const renderNav = (onItemClick?: () => void) => (
    <>
      <nav className="flex-1 overflow-y-auto pr-2 pb-4 no-scrollbar space-y-2">
        {navItems.map(item => (
          <SidebarItem 
            key={item.value} 
            icon={item.icon} 
            label={item.label} 
            active={activeView === item.value} 
            onClick={() => { setActiveView(item.value as ViewType); onItemClick?.(); }} 
          />
        ))}
        <div className="pt-4 mt-4 border-t border-slate-800 space-y-2">
          {bottomItems.map(item => (
            <SidebarItem 
              key={item.value} 
              icon={item.icon} 
              label={item.label} 
              active={activeView === item.value} 
              onClick={() => { setActiveView(item.value as ViewType); onItemClick?.(); }} 
            />
          ))}
        </div>
      </nav>
      {user && (
        <div className="mt-4 p-4 bg-slate-800/50 rounded-xl border border-slate-800 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center font-bold text-white uppercase shrink-0">
                {user.name[0]}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold truncate text-white">{user.name}</p>
                <p className="text-xs text-slate-400 truncate">{user.role}</p>
              </div>
            </div>
            <button
              onClick={() => { logout(); onItemClick?.(); }}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-700 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:flex flex-col w-64 p-6 sticky top-0 transition-all duration-300 glass border-r border-slate-200 dark:border-[#1E293B]",
        !isDarkMode && "bg-white/70"
      )}>
        <div className="flex items-center gap-3 mb-10 px-2 shrink-0">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/40">
            <SiteIcon size={24} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight text-slate-900 dark:text-white uppercase">{siteTitle}</h1>
            {siteSubtitle && <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold">{siteSubtitle}</p>}
          </div>
        </div>
        {renderNav()}
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
            />
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-72 glass p-6 z-50 lg:hidden flex flex-col"
            >
              <div className="flex items-center justify-between mb-10 shrink-0">
                <div 
                  className="flex items-center gap-3 cursor-pointer" 
                  onClick={() => setIsMobileOpen(false)}
                >
                  <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                    <SiteIcon size={24} className="text-white" />
                  </div>
                  <div>
                    <h1 className="font-bold text-lg leading-tight text-slate-900 dark:text-white uppercase">{siteTitle}</h1>
                    {siteSubtitle && <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold">{siteSubtitle}</p>}
                  </div>
                </div>
                <button onClick={() => setIsMobileOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500 dark:text-slate-400">
                  <X size={24} />
                </button>
              </div>
              {renderNav(() => setIsMobileOpen(false))}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
