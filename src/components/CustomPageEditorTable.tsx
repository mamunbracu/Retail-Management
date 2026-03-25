import { useState, useEffect } from 'react';
import { CustomPageElement, Employee, Sale, Shift, OrderRecord } from '../types';
import { Trash2, Eye, EyeOff, ChevronUp, ChevronDown, Plus, Layout, Table as TableIcon, Type, Heading, BarChart3, Palette, Maximize2, Smile, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils';
import * as LucideIcons from 'lucide-react';
import { api } from '../services/api';

interface CustomPageEditorTableProps {
  cards: CustomPageElement[];
  updateCard: (id: string, updates: Partial<CustomPageElement>) => void;
  removeCard: (id: string) => void;
}

export const CustomPageEditorTable = ({ cards, updateCard, removeCard }: CustomPageEditorTableProps) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showIconPicker, setShowIconPicker] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [tableData, setTableData] = useState<Record<string, any[]>>({});

  const emojis = ['🚀', '🔥', '⭐', '💎', '📈', '💰', '👥', '📅', '📦', '✅', '⚠️', '🚨', '💡', '🏆', '🎉', '📊', '🛒', '📄', '🛠️', '✨'];

  useEffect(() => {
    const fetchTableData = async () => {
      const [emp, sales, roster, orders] = await Promise.all([
        api.getEmployees(),
        api.getSales(),
        api.getRoster(),
        api.getOrderList()
      ]);
      setTableData({
        employees: emp,
        sales: sales,
        roster: roster,
        orders: orders
      });
    };
    fetchTableData();
  }, []);

  const moveCard = (id: string, direction: 'up' | 'down') => {
    const index = cards.findIndex(c => c.id === id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === cards.length - 1) return;

    const newCards = [...cards];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newCards[index], newCards[targetIndex]] = [newCards[targetIndex], newCards[index]];
    
    // Update orders
    newCards.forEach((c, i) => updateCard(c.id, { order: i }));
  };

  const getTableColumns = (dataSource: string | undefined) => {
    if (!dataSource || dataSource === 'none') return [];
    if (['bestEmployee', 'totalDocuments', 'totalDeliveries', 'pendingSalary', 'paidSalary', 'performance'].includes(dataSource)) {
      return ['name', 'value'];
    }
    if (!tableData[dataSource] || tableData[dataSource].length === 0) return [];
    
    const data = tableData[dataSource];
    return Array.from(new Set(data.flatMap(row => Object.keys(row)))).filter(key => {
      const firstValidRow = data.find(row => row[key] !== null && row[key] !== undefined);
      return firstValidRow ? typeof firstValidRow[key] !== 'object' && key !== 'id' : key !== 'id';
    });
  };

  return (
    <div className="space-y-4">
      <AnimatePresence mode="popLayout">
        {cards.sort((a, b) => a.order - b.order).map((card, index) => {
          const isExpanded = expandedId === card.id;
          const Icon = (LucideIcons as any)[card.icon || 'Star'] || LucideIcons.Star;

          return (
            <motion.div
              key={card.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn(
                "glass-card overflow-hidden border transition-all duration-300",
                isExpanded ? "ring-2 ring-primary border-transparent" : "border-slate-200 dark:border-slate-800"
              )}
            >
              {/* Header */}
              <div className="p-4 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col gap-1">
                    <button 
                      onClick={() => moveCard(card.id, 'up')}
                      disabled={index === 0}
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded disabled:opacity-30"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button 
                      onClick={() => moveCard(card.id, 'down')}
                      disabled={index === cards.length - 1}
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded disabled:opacity-30"
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>
                  <div className={cn("p-2 rounded-xl text-white", card.style.bgColor || "bg-primary")}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      {card.title || 'Untitled Element'}
                      <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                        {card.type}
                      </span>
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {card.dataSource !== 'none' ? `Source: ${card.dataSource}` : 'Static Content'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => updateCard(card.id, { isVisible: !card.isVisible })}
                    className={cn("p-2 rounded-xl transition-colors", card.isVisible ? "text-primary bg-primary/10" : "text-slate-400 bg-slate-100 dark:bg-slate-800")}
                  >
                    {card.isVisible ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                  <button 
                    onClick={() => setExpandedId(isExpanded ? null : card.id)}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                  >
                    <Layout size={18} />
                  </button>
                  <button 
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this element?')) {
                        removeCard(card.id);
                      }
                    }}
                    className="p-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {/* Editor Content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-slate-100 dark:border-slate-800"
                  >
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Basic Info */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                          <Type size={14} /> Content & Title
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Title</label>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              value={card.isDynamicTitle ? 'Dynamic (from Data Source)' : (card.title || '')} 
                              onChange={(e) => {
                                if (!card.isDynamicTitle) updateCard(card.id, { title: e.target.value });
                              }}
                              disabled={card.isDynamicTitle}
                              className={cn(
                                "flex-1 border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 ring-primary/20",
                                card.isDynamicTitle 
                                  ? "bg-slate-100 dark:bg-slate-800 border-transparent text-slate-400 cursor-not-allowed" 
                                  : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                              )}
                              placeholder="Enter title..."
                            />
                            <button 
                              onClick={() => updateCard(card.id, { isDynamicTitle: !card.isDynamicTitle })}
                              className={cn(
                                "px-3 py-2 rounded-xl text-xs font-bold transition-all",
                                card.isDynamicTitle ? "bg-primary text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
                              )}
                              title="Toggle Dynamic Title"
                            >
                              {card.isDynamicTitle ? 'Dynamic' : 'Static'}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Footer / Description</label>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              value={card.isDynamicFooter ? 'Dynamic (from Data Source)' : (card.footer || '')} 
                              onChange={(e) => {
                                if (!card.isDynamicFooter) updateCard(card.id, { footer: e.target.value });
                              }}
                              disabled={card.isDynamicFooter}
                              className={cn(
                                "flex-1 border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 ring-primary/20",
                                card.isDynamicFooter 
                                  ? "bg-slate-100 dark:bg-slate-800 border-transparent text-slate-400 cursor-not-allowed" 
                                  : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                              )}
                              placeholder="Card footer text..."
                            />
                            <button 
                              onClick={() => updateCard(card.id, { isDynamicFooter: !card.isDynamicFooter })}
                              className={cn(
                                "px-3 py-2 rounded-xl text-xs font-bold transition-all",
                                card.isDynamicFooter ? "bg-primary text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
                              )}
                              title="Toggle Dynamic Footer"
                            >
                              {card.isDynamicFooter ? 'Dynamic' : 'Static'}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Content / Sub-value</label>
                          <div className="flex gap-2">
                            <textarea 
                              value={card.isDynamicContent ? 'Dynamic (from Data Source)' : (card.content || '')} 
                              onChange={(e) => {
                                if (!card.isDynamicContent) updateCard(card.id, { content: e.target.value });
                              }}
                              disabled={card.isDynamicContent}
                              className={cn(
                                "flex-1 border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 ring-primary/20 h-20 resize-none",
                                card.isDynamicContent 
                                  ? "bg-slate-100 dark:bg-slate-800 border-transparent text-slate-400 cursor-not-allowed" 
                                  : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                              )}
                              placeholder="Enter content..."
                            />
                            <button 
                              onClick={() => updateCard(card.id, { isDynamicContent: !card.isDynamicContent })}
                              className={cn(
                                "px-3 py-2 rounded-xl text-xs font-bold transition-all h-fit",
                                card.isDynamicContent ? "bg-primary text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
                              )}
                              title="Toggle Dynamic Content"
                            >
                              {card.isDynamicContent ? 'Dynamic' : 'Static'}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Data & Icon */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                          <BarChart3 size={14} /> Data & Icon
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Data Source</label>
                          <select 
                            value={card.dataSource || 'none'}
                            onChange={(e) => updateCard(card.id, { dataSource: e.target.value as any })}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 ring-primary/20"
                          >
                            <option value="none">None (Static)</option>
                            <option value="employees">Employees Table</option>
                            <option value="sales">Sales Table</option>
                            <option value="roster">Roster Table</option>
                            <option value="orders">Orders Table</option>
                            <option value="bestEmployee">Best Employee (Dynamic)</option>
                            <option value="totalDocuments">Total Documents</option>
                            <option value="totalDeliveries">Today's Deliveries</option>
                            <option value="pendingSalary">Pending Salary</option>
                            <option value="paidSalary">Paid Salary</option>
                            <option value="performance">Performance %</option>
                          </select>
                        </div>
                        <div className="flex gap-4">
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Icon</label>
                            <button 
                              onClick={() => setShowIconPicker(card.id)}
                              className="w-full flex items-center justify-between bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm"
                            >
                              <span className="flex items-center gap-2">
                                <Icon size={16} className="text-primary" />
                                {card.icon || 'Star'}
                              </span>
                              <Plus size={14} />
                            </button>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Emoji</label>
                            <button 
                              onClick={() => setShowEmojiPicker(card.id)}
                              className="w-16 h-10 flex items-center justify-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-lg"
                            >
                              {card.emoji || '🚀'}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Layout & Style */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                          <Palette size={14} /> Style & Layout
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Background Color</label>
                            <select 
                              value={card.style.bgColor || 'bg-[#151A2D]'}
                              onChange={(e) => updateCard(card.id, { style: { ...card.style, bgColor: e.target.value } })}
                              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 ring-primary/20"
                            >
                              <option value="bg-[#151A2D]">Dashboard Dark</option>
                              <option value="bg-white">Default White</option>
                              <option value="bg-primary">Primary (Tomato)</option>
                              <option value="bg-blue-500">Blue</option>
                              <option value="bg-blue-600">Deep Blue</option>
                              <option value="bg-emerald-500">Emerald</option>
                              <option value="bg-emerald-600">Deep Emerald</option>
                              <option value="bg-amber-500">Amber</option>
                              <option value="bg-purple-500">Purple</option>
                              <option value="bg-rose-500">Rose</option>
                              <option value="bg-rose-600">Deep Rose</option>
                              <option value="bg-slate-800">Slate 800</option>
                              <option value="bg-slate-900">Slate 900</option>
                              <option value="bg-black">Black</option>
                              <option value="bg-orange-500">Orange</option>
                              <option value="bg-cyan-500">Cyan</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Text Color</label>
                            <select 
                              value={card.style.color || ''}
                              onChange={(e) => updateCard(card.id, { style: { ...card.style, color: e.target.value } })}
                              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 ring-primary/20"
                            >
                              <option value="">Auto (Contrast)</option>
                              <option value="text-slate-900">Slate Dark</option>
                              <option value="text-white">White</option>
                              <option value="text-primary">Primary</option>
                              <option value="text-blue-500">Blue</option>
                              <option value="text-emerald-500">Emerald</option>
                              <option value="text-amber-500">Amber</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Size (Cards per row)</label>
                          <div className="flex gap-2">
                            {[
                              { span: 1, label: '4/row' },
                              { span: 2, label: '3/row' },
                              { span: 3, label: '2/row' },
                              { span: 4, label: '1/row' }
                            ].map(({ span, label }) => (
                              <button
                                key={span}
                                onClick={() => updateCard(card.id, { style: { ...card.style, gridSpan: span } })}
                                className={cn(
                                  "flex-1 py-2 rounded-xl text-xs font-bold border transition-all",
                                  card.style.gridSpan === span 
                                    ? "bg-primary border-primary text-white" 
                                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500"
                                )}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Analytics Config */}
                      {card.type === 'analytics' && (
                        <div className="col-span-full border-t border-slate-100 dark:border-slate-800 pt-6">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                            <BarChart3 size={14} /> Analytics Configuration
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">Chart Type</label>
                              <select 
                                value={card.analyticsConfig?.chartType || 'list'}
                                onChange={(e) => updateCard(card.id, { analyticsConfig: { ...card.analyticsConfig!, chartType: e.target.value as any } })}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 ring-primary/20"
                              >
                                <option value="list">Data List</option>
                                <option value="bar">Bar Chart</option>
                                <option value="pie">Pie Chart</option>
                                <option value="line">Line Chart</option>
                                <option value="area">Area Chart</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">Value Key</label>
                              <input 
                                type="text" 
                                value={card.analyticsConfig?.dataKey || 'value'} 
                                onChange={(e) => updateCard(card.id, { analyticsConfig: { ...card.analyticsConfig!, dataKey: e.target.value } })}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 ring-primary/20"
                                placeholder="e.g., value"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">Label Key</label>
                              <input 
                                type="text" 
                                value={card.analyticsConfig?.nameKey || 'name'} 
                                onChange={(e) => updateCard(card.id, { analyticsConfig: { ...card.analyticsConfig!, nameKey: e.target.value } })}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 ring-primary/20"
                                placeholder="e.g., name"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                        {/* Table Column Config */}
                      {card.type === 'table' && card.dataSource !== 'none' && (
                        <div className="col-span-full border-t border-slate-100 dark:border-slate-800 pt-6">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                            <TableIcon size={14} /> Column Visibility
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {getTableColumns(card.dataSource).map(col => {
                              const isVisible = card.tableConfig?.visibleColumns?.includes(col) ?? true;
                              return (
                                <button
                                  key={col}
                                  onClick={() => {
                                    const current = card.tableConfig?.visibleColumns || getTableColumns(card.dataSource);
                                    const next = isVisible 
                                      ? current.filter(c => c !== col)
                                      : [...current, col];
                                    updateCard(card.id, { tableConfig: { visibleColumns: next } });
                                  }}
                                  className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                                    isVisible 
                                      ? "bg-primary/10 border-primary/20 text-primary" 
                                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400"
                                  )}
                                >
                                  {isVisible ? <Eye size={12} /> : <EyeOff size={12} />}
                                  {col}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      
                      {/* Save Button */}
                      <div className="col-span-full pt-4">
                        <button 
                          onClick={() => setExpandedId(null)}
                          className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Icon Picker Modal */}
      {showIconPicker && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowIconPicker(null)}
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">Choose Icon</h3>
              <button onClick={() => setShowIconPicker(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                <Plus size={20} className="rotate-45" />
              </button>
            </div>
            <div className="overflow-y-auto p-2 grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
              {Object.keys(LucideIcons).filter(name => name !== 'createLucideIcon' && !name.endsWith('Icon')).slice(0, 200).map(name => {
                const Icon = (LucideIcons as any)[name];
                return (
                  <button
                    key={name}
                    onClick={() => {
                      updateCard(showIconPicker, { icon: name });
                      setShowIconPicker(null);
                    }}
                    className="p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors"
                    title={name}
                  >
                    <Icon size={20} className="text-slate-600 dark:text-slate-400" />
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
      {/* Emoji Picker Modal */}
      {showEmojiPicker && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowEmojiPicker(null)}
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">Choose Emoji</h3>
              <button onClick={() => setShowEmojiPicker(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                <X size={20} />
              </button>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {emojis.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => {
                    updateCard(showEmojiPicker, { emoji });
                    setShowEmojiPicker(null);
                  }}
                  className="p-4 text-2xl rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
