import { useState, useEffect } from 'react';
import { 
  Save, Plus, Trash2, Eye, EyeOff, 
  Settings, Type, Image as ImageIcon,
  ChevronUp, ChevronDown, Search
} from 'lucide-react';
import { motion } from 'motion/react';
import { AppSettings, SidebarItem, DashboardCard, ViewType } from '../types';
import { api } from '../services/api';
import { PageHeader } from '../components/PageHeader';
import { toast } from 'react-hot-toast';
import * as LucideIcons from 'lucide-react';
import { cn } from '../utils';

interface AppSettingsViewProps {
  onBack: () => void;
  onUpdate: (settings: AppSettings) => void;
}

const ICON_LIST = Object.keys(LucideIcons).filter(key => 
  typeof (LucideIcons as any)[key] === 'function' || 
  (typeof (LucideIcons as any)[key] === 'object' && (LucideIcons as any)[key].render)
);

const VIEW_TYPES: ViewType[] = [
  'Dashboard', 'Analytics', 'Admin Hub', 'Instruction', 'Order List', 
  'Resources', 'Roster', 'Shift Task', 'Documents', 'Staff Timesheet',
  'Profile', 'Finance', 'Finance Management', 'Salary', 'App Settings'
];

const COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 
  'bg-rose-500', 'bg-indigo-500', 'bg-orange-500', 'bg-slate-500',
  'bg-pink-500', 'bg-cyan-500', 'bg-teal-500', 'bg-lime-500'
];

export const AppSettingsView = ({ onBack, onUpdate }: AppSettingsViewProps) => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'sidebar' | 'dashboard'>('general');
  const [isSaving, setIsSaving] = useState(false);
  const [iconSearch, setIconSearch] = useState('');
  const [showIconPicker, setShowIconPicker] = useState<{ type: 'site' | 'sidebar' | 'card', id?: string } | null>(null);

  useEffect(() => {
    api.getAppSettings().then(setSettings).catch(err => {
      console.error(err);
      toast.error('Failed to load settings');
    });
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setIsSaving(true);
    try {
      const updated = await api.saveAppSettings(settings);
      setSettings(updated);
      onUpdate(updated);
      toast.success('Settings saved successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const updateSidebarItem = (id: string, updates: Partial<SidebarItem>) => {
    if (!settings) return;
    setSettings({
      ...settings,
      sidebarItems: settings.sidebarItems.map(item => 
        item.id === id ? { ...item, ...updates } : item
      )
    });
  };

  const addSidebarItem = () => {
    if (!settings) return;
    const newItem: SidebarItem = {
      id: Math.random().toString(36).substring(2, 9),
      label: 'New Custom Page',
      icon: 'Layout',
      view: 'New Custom Page',
      order: settings.sidebarItems.length,
      isVisible: true
    };
    setSettings({
      ...settings,
      sidebarItems: [...settings.sidebarItems, newItem]
    });
  };

  const removeSidebarItem = (id: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      sidebarItems: settings.sidebarItems.filter(item => item.id !== id)
    });
  };

  const updateDashboardCard = (id: string, updates: Partial<DashboardCard>) => {
    if (!settings) return;
    setSettings({
      ...settings,
      dashboardCards: settings.dashboardCards.map(card => 
        card.id === id ? { ...card, ...updates } : card
      )
    });
  };

  const addDashboardCard = () => {
    if (!settings) return;
    const newCard: DashboardCard = {
      id: Math.random().toString(36).substring(2, 15),
      title: 'New Card',
      icon: 'Star',
      content: 'Card Content',
      type: 'static',
      color: 'bg-blue-500',
      order: settings.dashboardCards.length,
      isVisible: true
    };
    setSettings({
      ...settings,
      dashboardCards: [...settings.dashboardCards, newCard]
    });
  };

  const removeDashboardCard = (id: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      dashboardCards: settings.dashboardCards.filter(card => card.id !== id)
    });
  };

  const moveItem = (type: 'sidebar' | 'dashboard', index: number, direction: 'up' | 'down') => {
    if (!settings) return;
    const items = type === 'sidebar' ? [...settings.sidebarItems] : [...settings.dashboardCards];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= items.length) return;
    
    const [movedItem] = items.splice(index, 1);
    items.splice(newIndex, 0, movedItem as any);
    
    // Update orders
    const updatedItems = items.map((item, i) => ({ ...item, order: i }));
    
    if (type === 'sidebar') {
      setSettings({ ...settings, sidebarItems: updatedItems as SidebarItem[] });
    } else {
      setSettings({ ...settings, dashboardCards: updatedItems as DashboardCard[] });
    }
  };

  const filteredIcons = ICON_LIST.filter(name => 
    name.toLowerCase().includes(iconSearch.toLowerCase())
  ).slice(0, 100);

  const getIconComponent = (name: string) => {
    const Icon = (LucideIcons as any)[name] || LucideIcons.HelpCircle;
    return <Icon size={20} />;
  };

  if (!settings) return <div className="p-8 text-center">Loading settings...</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader title="App Settings" onBack={onBack}>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-primary text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition-transform disabled:opacity-50"
        >
          <Save size={20} />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </PageHeader>

      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
        {(['general', 'sidebar', 'dashboard'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-6 py-2 rounded-xl font-bold capitalize transition-all",
              activeTab === tab 
                ? "bg-white dark:bg-slate-700 text-primary shadow-sm" 
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="glass-card p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4">
        {activeTab === 'general' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Type size={16} /> Site Title
                </label>
                <input 
                  value={settings.siteTitle}
                  onChange={e => setSettings({ ...settings, siteTitle: e.target.value })}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all"
                  placeholder="e.g. FIRESTATION"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <ImageIcon size={16} /> Site Icon
                </label>
                <button 
                  onClick={() => setShowIconPicker({ type: 'site' })}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 text-primary rounded-lg">
                      {getIconComponent(settings.siteIcon)}
                    </div>
                    <span className="font-medium">{settings.siteIcon}</span>
                  </div>
                  <Settings size={16} className="text-slate-400" />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sidebar' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800 dark:text-white">Sidebar Navigation</h3>
              <button 
                onClick={addSidebarItem}
                className="text-primary hover:bg-primary/10 p-2 rounded-xl flex items-center gap-2 font-bold transition-all"
              >
                <Plus size={20} /> Add Item
              </button>
            </div>
            
            <div className="space-y-3">
              {settings.sidebarItems.sort((a, b) => a.order - b.order).map((item, index) => (
                <div 
                  key={item.id}
                  className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl group hover:border-primary/30 transition-all"
                >
                  <div className="flex flex-col gap-1">
                    <button 
                      onClick={() => moveItem('sidebar', index, 'up')}
                      disabled={index === 0}
                      className="p-1 text-slate-400 hover:text-primary disabled:opacity-30"
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button 
                      onClick={() => moveItem('sidebar', index, 'down')}
                      disabled={index === settings.sidebarItems.length - 1}
                      className="p-1 text-slate-400 hover:text-primary disabled:opacity-30"
                    >
                      <ChevronDown size={16} />
                    </button>
                  </div>

                  <button 
                    onClick={() => setShowIconPicker({ type: 'sidebar', id: item.id })}
                    className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-primary hover:scale-105 transition-transform"
                  >
                    {getIconComponent(item.icon)}
                  </button>

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input 
                      value={item.label}
                      onChange={e => updateSidebarItem(item.id, { label: e.target.value })}
                      className="bg-transparent border-b border-transparent focus:border-primary outline-none font-bold py-1"
                      placeholder="Label"
                    />
                    <div className="relative">
                      <input 
                        list="view-types"
                        value={item.view}
                        onChange={e => updateSidebarItem(item.id, { view: e.target.value })}
                        className="bg-transparent border-b border-transparent focus:border-primary outline-none text-sm text-slate-500 w-full py-1"
                        placeholder="View Name (e.g. Dashboard or Custom)"
                      />
                      <datalist id="view-types">
                        {VIEW_TYPES.map(v => <option key={v} value={v} />)}
                      </datalist>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => updateSidebarItem(item.id, { isVisible: !item.isVisible })}
                      className={cn(
                        "p-2 rounded-lg transition-colors",
                        item.isVisible ? "text-emerald-500 hover:bg-emerald-50" : "text-slate-400 hover:bg-slate-100"
                      )}
                    >
                      {item.isVisible ? <Eye size={20} /> : <EyeOff size={20} />}
                    </button>
                    <button 
                      onClick={() => removeSidebarItem(item.id)}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800 dark:text-white">Dashboard Cards</h3>
              <button 
                onClick={addDashboardCard}
                className="text-primary hover:bg-primary/10 p-2 rounded-xl flex items-center gap-2 font-bold transition-all"
              >
                <Plus size={20} /> Add Card
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {settings.dashboardCards.sort((a, b) => a.order - b.order).map((card, index) => (
                <div 
                  key={card.id}
                  className="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col">
                        <button onClick={() => moveItem('dashboard', index, 'up')} disabled={index === 0} className="p-1 text-slate-400 hover:text-primary disabled:opacity-30"><ChevronUp size={16} /></button>
                        <button onClick={() => moveItem('dashboard', index, 'down')} disabled={index === settings.dashboardCards.length - 1} className="p-1 text-slate-400 hover:text-primary disabled:opacity-30"><ChevronDown size={16} /></button>
                      </div>
                      <button 
                        onClick={() => setShowIconPicker({ type: 'card', id: card.id })}
                        className={cn("p-3 rounded-2xl text-white shadow-lg", card.color)}
                      >
                        {getIconComponent(card.icon)}
                      </button>
                      <div className="flex-1">
                        <input 
                          value={card.title}
                          onChange={e => updateDashboardCard(card.id, { title: e.target.value })}
                          className="bg-transparent border-b border-transparent focus:border-primary outline-none font-bold text-lg w-full"
                          placeholder="Card Title"
                        />
                        <div className="flex gap-2 mt-2">
                          {COLORS.map(c => (
                            <button 
                              key={c}
                              onClick={() => updateDashboardCard(card.id, { color: c })}
                              className={cn("w-4 h-4 rounded-full border-2", card.color === c ? "border-white ring-2 ring-primary" : "border-transparent", c)}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => updateDashboardCard(card.id, { isVisible: !card.isVisible })}
                        className={cn("p-2 rounded-lg", card.isVisible ? "text-emerald-500" : "text-slate-400")}
                      >
                        {card.isVisible ? <Eye size={20} /> : <EyeOff size={20} />}
                      </button>
                      <button onClick={() => removeDashboardCard(card.id)} className="p-2 text-rose-500"><Trash2 size={20} /></button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">
                        {card.type === 'dynamic' ? 'Data Source' : 'Content / Value'}
                      </label>
                      {card.type === 'dynamic' ? (
                        <select
                          value={card.content}
                          onChange={e => {
                            const val = e.target.value;
                            const titleMap: Record<string, string> = {
                              '{todaySales}': "Today's Sales",
                              '{totalEmployees}': "Total Employees",
                              '{upcomingShifts}': "Upcoming Shifts",
                              '{performanceValue}': "Performance",
                              '{outstandingSalary}': "Outstanding Salary",
                              '{totalSales}': "Total Sales",
                              '{bestEmployee}': "Best Employee (Sales)",
                              '{todayOrdersToPlace}': "Orders to Place Today",
                              '{todayDeliveries}': "Deliveries Today",
                              '{nextOrderPerson}': "Next Order By"
                            };
                            updateDashboardCard(card.id, { 
                              content: val,
                              title: titleMap[val] || card.title
                            });
                          }}
                          className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                        >
                          <option value="">Select data source...</option>
                          <option value="{todaySales}">Today's Sales</option>
                          <option value="{totalEmployees}">Total Employees</option>
                          <option value="{upcomingShifts}">Upcoming Shifts Today</option>
                          <option value="{performanceValue}">Performance Percentage</option>
                          <option value="{outstandingSalary}">Outstanding Salary</option>
                          <option value="{totalSales}">Total Number of Sales</option>
                          <option value="{bestEmployee}">Best Employee (by Sales)</option>
                          <option value="{todayOrdersToPlace}">Orders to Place Today</option>
                          <option value="{todayDeliveries}">Deliveries Today</option>
                          <option value="{nextOrderPerson}">Next Order By</option>
                        </select>
                      ) : (
                        <input 
                          value={card.content}
                          onChange={e => updateDashboardCard(card.id, { content: e.target.value })}
                          className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                          placeholder="Static text"
                        />
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Type</label>
                      <select 
                        value={card.type}
                        onChange={e => {
                          const newType = e.target.value as 'static' | 'dynamic';
                          updateDashboardCard(card.id, { 
                            type: newType,
                            content: newType === 'dynamic' ? '{todaySales}' : card.content
                          });
                        }}
                        className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                      >
                        <option value="static">Static Text</option>
                        <option value="dynamic">Dynamic (Database)</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Icon Picker Modal */}
      {showIconPicker && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowIconPicker(null)}
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
          >
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-bold">Select Icon</h3>
              <div className="relative flex-1 max-w-xs mx-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  autoFocus
                  placeholder="Search icons..."
                  value={iconSearch}
                  onChange={e => setIconSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <button onClick={() => setShowIconPicker(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
                <Trash2 size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4 no-scrollbar">
              {filteredIcons.map(name => (
                <button
                  key={name}
                  onClick={() => {
                    if (showIconPicker.type === 'site') {
                      setSettings({ ...settings, siteIcon: name });
                    } else if (showIconPicker.type === 'sidebar' && showIconPicker.id) {
                      updateSidebarItem(showIconPicker.id, { icon: name });
                    } else if (showIconPicker.type === 'card' && showIconPicker.id) {
                      updateDashboardCard(showIconPicker.id, { icon: name });
                    }
                    setShowIconPicker(null);
                    setIconSearch('');
                  }}
                  className="flex flex-col items-center gap-2 p-3 hover:bg-primary/10 rounded-2xl transition-all group"
                  title={name}
                >
                  <div className="text-slate-600 dark:text-slate-400 group-hover:text-primary group-hover:scale-110 transition-all">
                    {getIconComponent(name)}
                  </div>
                  <span className="text-[10px] text-slate-400 truncate w-full text-center">{name}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
