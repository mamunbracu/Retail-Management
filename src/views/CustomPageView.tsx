import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppSettings, Employee, Sale, Shift, OrderRecord, AppDocument, CustomPageElement } from '../types';
import * as LucideIcons from 'lucide-react';
import { api } from '../services/api';
import { CustomPageEditorTable } from '../components/CustomPageEditorTable';
import { DynamicTable } from '../components/DynamicTable';
import { HighlightCard } from '../components/HighlightCard';
import { PageHeader } from '../components/PageHeader';
import { calculateHours, cn } from '../utils';
import { toast } from 'react-hot-toast';
import { Settings, Save, Layout, Table as TableIcon, BarChart3, Heading, Type, Plus, X, Trash2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';

interface CustomPageViewProps {
  viewName: string;
}

export const CustomPageView = ({ viewName }: CustomPageViewProps) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [roster, setRoster] = useState<Shift[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [documents, setDocuments] = useState<AppDocument[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [showIconPicker, setShowIconPicker] = useState<string | null>(null);
  const [cards, setCards] = useState<CustomPageElement[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isDark = document.documentElement.classList.contains('dark');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const results = await Promise.allSettled([
          api.getEmployees(),
          api.getSales(),
          api.getRoster(),
          api.getAppSettings(),
          api.getOrderList(),
          api.getDocuments()
        ]);
        
        results.forEach((res, i) => {
          if (res.status === 'rejected') {
            console.error(`API call ${i} failed:`, res.reason);
          } else {
            console.log(`API call ${i} succeeded:`, res.value);
          }
        });

        const [empData, salesData, rosterData, settingsData, ordersData, docsData] = results;
        
        if (empData.status === 'fulfilled') setEmployees(empData.value);
        if (salesData.status === 'fulfilled') setSales(salesData.value);
        if (rosterData.status === 'fulfilled') setRoster(rosterData.value);
        if (ordersData.status === 'fulfilled') setOrders(ordersData.value);
        if (docsData.status === 'fulfilled') setDocuments(docsData.value);
        if (settingsData.status === 'fulfilled') {
          const settings = settingsData.value;
          console.log('Settings fetched successfully:', settings);
          setAppSettings(settings);
          
          const customPages = settings.customPages || {};
          console.log('Custom pages found:', Object.keys(customPages));
          
          const loadedCards = customPages[viewName] || [];
          console.log(`Cards loaded for view "${viewName}":`, loadedCards);
          
          setCards(loadedCards);
        } else {
          console.error('Failed to fetch settings:', settingsData.reason);
        }
      } catch (error: any) {
        toast.error(`Error: ${error.message || 'Failed to connect to server'}`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [viewName]);

  // Dynamic calculations
  const today = new Date().toISOString().split('T')[0];
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDay = days[new Date().getDay()];
  
  const todaySales = sales.filter(s => s.date === today).reduce((acc, curr) => acc + curr.totalSales, 0);
  const totalEarned = roster.reduce((acc, curr) => {
    const emp = employees.find(e => e.name === curr.staffName);
    return acc + (calculateHours(curr.startTime, curr.endTime) * (curr.hourlyRate || emp?.hourlyRate || 0));
  }, 0);
  const totalPaid = roster.reduce((acc, curr) => {
    const emp = employees.find(e => e.name === curr.staffName);
    const shiftTotal = calculateHours(curr.startTime, curr.endTime) * (curr.hourlyRate || emp?.hourlyRate || 0);
    return acc + (curr.paidAmount || (curr.isPaid ? shiftTotal : 0));
  }, 0);
  const outstandingSalary = totalEarned - totalPaid;
  const todayShifts = roster.filter(shift => shift.date === today);
  const targetSale = 500;
  const averageSale = sales.length > 0 ? sales.reduce((acc, curr) => acc + curr.totalSales, 0) / sales.length : 0;
  const performanceValue = Math.min(Math.round((averageSale / targetSale) * 100), 100);
  
  const todayOrdersList = orders.filter(o => o.orderDay === currentDay);
  const todayDeliveriesList = orders.filter(o => o.deliveryDay === currentDay);
  const nextOrder = todayOrdersList.sort((a, b) => a.orderedTime.localeCompare(b.orderedTime))[0];
  const nextOrderPerson = nextOrder ? nextOrder.orderedBy : 'None';

  const getTableData = (dataSource: string | undefined, rawData: any[]) => {
    switch (dataSource) {
      case 'employees': return employees;
      case 'sales': return sales;
      case 'roster': return roster;
      case 'orders': return orders;
      default: return rawData;
    }
  };

  const getDataSourceValue = (dataSource: string | undefined) => {
    console.log('getDataSourceValue called with:', dataSource);
    console.log('Current state:', { employees, roster, sales, orders, documents });
    if (!dataSource || dataSource === 'none') {
      console.log('Returning default because dataSource is none or undefined');
      return { headline: 'N/A', subValue: 'No data source', details: [], rawData: [] };
    }
    let result;
    switch (dataSource) {
      case 'employees': result = { 
        headline: employees.length.toString(), 
        subValue: 'Total Employees', 
        details: [`Active staff members: ${employees.length}`, `Total staff records: ${employees.length}`],
        rawData: employees.map(e => ({ name: e.name, value: e.hourlyRate || 0 }))
      }; break;
      case 'sales': result = { 
        headline: `$${todaySales.toFixed(2)}`, 
        subValue: 'Today\'s Sales', 
        details: [`Total sales: $${sales.reduce((a, b) => a + b.totalSales, 0).toFixed(2)}`, `Average sale: $${averageSale.toFixed(2)}`],
        rawData: sales.slice(-7).map(s => ({ name: s.date, value: s.totalSales }))
      }; break;
      case 'roster': result = { 
        headline: roster.length.toString(), 
        subValue: 'Total Shifts', 
        details: [`Scheduled shifts: ${roster.length}`, `Today's shifts: ${todayShifts.length}`],
        rawData: roster.slice(-7).map(r => ({ name: r.staffName, value: calculateHours(r.startTime, r.endTime) }))
      }; break;
      case 'orders': result = { 
        headline: orders.length.toString(), 
        subValue: 'Total Orders', 
        details: [`Total orders: ${orders.length}`, `Orders today: ${todayOrdersList.length}`],
        rawData: orders.slice(-7).map(o => ({ name: o.orderDay, value: o.fields.length }))
      }; break;
      case 'bestEmployee': {
        const salesByEmployee = sales.reduce((acc, curr) => {
          acc[curr.addedBy] = (acc[curr.addedBy] || 0) + curr.totalSales;
          return acc;
        }, {} as Record<string, number>);
        const best = Object.entries(salesByEmployee).sort((a, b) => b[1] - a[1])[0];
        result = { 
          headline: best ? best[0] : 'N/A', 
          subValue: 'Best Employee', 
          details: [best ? `Total Sales: $${best[1].toFixed(2)}` : 'No sales data', `Performance: ${performanceValue}%`],
          rawData: Object.entries(salesByEmployee).map(([name, value]) => ({ name, value }))
        };
        break;
      }
      case 'totalDocuments': result = { 
        headline: documents.length.toString(), 
        subValue: 'Total Documents', 
        details: [`Documents stored: ${documents.length}`, `Last updated: ${new Date().toLocaleDateString()}`],
        rawData: documents.map(d => ({ name: d.name, value: d.fileSize || 0 }))
      }; break;
      case 'totalDeliveries': result = { 
        headline: todayDeliveriesList.length.toString(), 
        subValue: 'Today\'s Deliveries', 
        details: [`Deliveries today: ${todayDeliveriesList.length}`, `Next delivery: ${nextOrderPerson}`],
        rawData: todayDeliveriesList.map(o => ({ name: o.orderedBy, value: 1 }))
      }; break;
      case 'pendingSalary': result = { 
        headline: `$${outstandingSalary.toFixed(2)}`, 
        subValue: 'Pending Salary', 
        details: [`Salary yet to be paid: $${outstandingSalary.toFixed(2)}`, `Total staff: ${employees.length}`],
        rawData: employees.map(e => {
          const empShifts = roster.filter(r => r.staffName === e.name);
          const earned = empShifts.reduce((acc, curr) => acc + (calculateHours(curr.startTime, curr.endTime) * (curr.hourlyRate || e.hourlyRate || 0)), 0);
          const paid = empShifts.reduce((acc, curr) => acc + (curr.paidAmount || (curr.isPaid ? (calculateHours(curr.startTime, curr.endTime) * (curr.hourlyRate || e.hourlyRate || 0)) : 0)), 0);
          return { name: e.name, value: earned - paid };
        })
      }; break;
      case 'paidSalary': result = { 
        headline: `$${totalPaid.toFixed(2)}`, 
        subValue: 'Paid Salary', 
        details: [`Total salary paid: $${totalPaid.toFixed(2)}`, `Last payment: ${new Date().toLocaleDateString()}`],
        rawData: employees.map(e => {
          const empShifts = roster.filter(r => r.staffName === e.name);
          const paid = empShifts.reduce((acc, curr) => acc + (curr.paidAmount || (curr.isPaid ? (calculateHours(curr.startTime, curr.endTime) * (curr.hourlyRate || e.hourlyRate || 0)) : 0)), 0);
          return { name: e.name, value: paid };
        })
      }; break;
      case 'performance': result = { 
        headline: `${performanceValue}%`, 
        subValue: 'Performance', 
        details: [`Average sale: $${averageSale.toFixed(2)}`, `Target: ${targetSale}`, `Performance against target: ${performanceValue}%`],
        rawData: [
          { name: 'Actual', value: averageSale },
          { name: 'Target', value: targetSale }
        ]
      }; break;
      default: 
        console.log('Unknown dataSource:', dataSource);
        result = { headline: 'N/A', subValue: 'Unknown', details: [], rawData: [] };
    }
    console.log('getDataSourceValue returning:', result);
    return result;
  };

  const getHexColor = (bgColor: string | undefined) => {
    if (!bgColor) return '#3b82f6';
    const colorMap: Record<string, string> = {
      'bg-blue-500': '#3b82f6',
      'bg-emerald-500': '#10b981',
      'bg-indigo-500': '#6366f1',
      'bg-rose-500': '#f43f5e',
      'bg-amber-500': '#f59e0b',
      'bg-slate-800': '#1e293b',
      'bg-slate-900': '#0f172a',
      'bg-[#151A2D]': '#151A2D',
      'bg-primary': '#FF6347',
      'bg-white': '#ffffff',
      'bg-black': '#000000',
      'bg-red-500': '#ef4444',
      'bg-green-500': '#22c55e',
      'bg-yellow-500': '#eab308',
      'bg-purple-500': '#a855f7',
      'bg-pink-500': '#ec4899',
      'bg-cyan-500': '#06b6d4',
      'bg-orange-500': '#f97316'
    };
    return colorMap[bgColor] || '#3b82f6';
  };

  const getContrastText = (bgColor: string | undefined) => {
    if (bgColor === 'bg-white' || (bgColor && bgColor.includes('light'))) return 'text-slate-900';
    return 'text-white';
  };

  const handleSave = async () => {
    if (!appSettings) {
      toast.error('App settings not loaded');
      return;
    }
    
    setIsSaving(true);
    try {
      console.log('Saving layout for view:', viewName);
      console.log('Cards to save:', cards);
      
      const updatedSettings = {
        ...appSettings,
        customPages: {
          ...(appSettings.customPages || {}),
          [viewName]: cards
        }
      };
      
      const savedSettings = await api.saveAppSettings(updatedSettings);
      console.log('Save response from server:', savedSettings);
      
      setAppSettings(savedSettings);
      // Ensure local cards state matches what was saved
      if (savedSettings.customPages && savedSettings.customPages[viewName]) {
        setCards(savedSettings.customPages[viewName]);
      }
      
      setIsEditMode(false);
      toast.success('Page layout saved successfully!');
    } catch (error: any) {
      console.error('Error saving layout:', error);
      toast.error(`Failed to save layout: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const addCard = (type: CustomPageElement['type']) => {
    const dataSource = type === 'table' ? 'employees' : 'none';
    const isDynamic = dataSource !== 'none';
    const newElement: CustomPageElement = {
      id: Math.random().toString(36).substring(2, 9),
      type: type,
      title: 'New ' + type.charAt(0).toUpperCase() + type.slice(1),
      isDynamicTitle: isDynamic,
      content: type === 'card' ? 'New Card' : '',
      isDynamicContent: isDynamic,
      dataSource: dataSource,
      icon: 'Star',
      style: {
        color: '', // Empty means use getContrastText
        bgColor: 'bg-[#151A2D]',
        gridSpan: 1
      },
      analyticsConfig: {
        chartType: 'bar',
        dataKey: 'value',
        nameKey: 'name'
      },
      footer: '',
      isDynamicFooter: isDynamic,
      emoji: '🚀',
      order: cards.length,
      isVisible: true
    };
    setCards([...cards, newElement]);
    setShowAddModal(false);
  };

  const updateCard = (id: string, updates: Partial<CustomPageElement>) => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const removeCard = (id: string) => {
    setCards(prev => prev.filter(c => c.id !== id));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const visibleCards = cards.filter(c => c.isVisible).sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader title={viewName} />
        <div className="flex gap-2">
          {isEditMode ? (
            <button 
              onClick={() => setIsEditMode(false)}
              className="btn-secondary flex items-center gap-2"
            >
              Finish Editing
            </button>
          ) : (
            <button onClick={() => setIsEditMode(true)} className="btn-secondary flex items-center gap-2">
              <Settings size={16} /> Edit Page
            </button>
          )}
        </div>
      </div>

      {isEditMode && (
        <div className="flex justify-center mb-8">
          <button 
            onClick={() => setShowAddModal(true)}
            className="group relative px-8 py-4 bg-primary text-white rounded-full font-bold shadow-xl shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-1 transition-all duration-300 flex items-center gap-3 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <Plus size={20} />
            Add New Section
          </button>
        </div>
      )}

      {cards.length === 0 ? (
        <div className="text-center py-20 glass-card rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
          <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-400">
            <Layout size={40} />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Your page is empty</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8">
            Click "Edit Page" to start adding cards, tables, and analytics to your custom page.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                  {visibleCards
                    .sort((a, b) => {
                      const aIsTable = a.type === 'table';
                      const bIsTable = b.type === 'table';
                      if (aIsTable && !bIsTable) return 1;
                      if (!aIsTable && bIsTable) return -1;
                      return a.order - b.order;
                    })
                    .map((card, index) => {
                    const data = getDataSourceValue(card.dataSource);
                    console.log('Rendering card:', card.id, 'Type:', card.type, 'DynamicContent:', card.isDynamicContent, 'Content:', card.content, 'Data:', data);
                    const Icon = (LucideIcons as any)[card.icon || 'Star'] || LucideIcons.Star;
                    
                    const title = card.isDynamicTitle ? data.subValue : (card.title || '');
                    const content = card.isDynamicContent ? data.headline : (card.content || '');
                    const footer = card.isDynamicFooter ? data.details.join(' • ') : (card.footer || '');

                    const isWhiteBg = card.style.bgColor === 'bg-white' || !card.style.bgColor;
                    const cardBgClass = isWhiteBg ? "glass-card" : cn(card.style.bgColor, "text-white");
                    const textColor = card.style.color || (isWhiteBg ? "text-slate-800 dark:text-white" : "text-white");
                    const subTextColor = isWhiteBg ? "text-slate-500 dark:text-slate-400" : "text-white/80";
                    const chartColor = isWhiteBg ? getHexColor('bg-primary') : '#ffffff';
                    const COLORS = isWhiteBg 
                      ? ['#FF6347', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899']
                      : ['#ffffff', '#fcd34d', '#6ee7b7', '#93c5fd', '#c4b5fd', '#f9a8d4'];

                    return (
                      <motion.div
                        key={card.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={cn(
                          "transition-all relative group/card",
                          card.type === 'table' ? "col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-5" : "col-span-1"
                        )}
                      >
                        {isEditMode && (
                          <div className="absolute top-4 right-4 z-10 flex gap-2 opacity-0 group-hover/card:opacity-100 transition-all">
                            <button
                              onClick={() => setEditingCardId(card.id)}
                              className="p-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm text-slate-700 dark:text-slate-200 rounded-full shadow-lg hover:scale-110 hover:bg-primary hover:text-white transition-all"
                              title="Update Element"
                            >
                              <Settings size={16} />
                            </button>
                            <button
                              onClick={() => removeCard(card.id)}
                              className="p-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm text-red-500 rounded-full shadow-lg hover:scale-110 hover:bg-red-500 hover:text-white transition-all"
                              title="Delete Element"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                        {card.type === 'card' && (
                          <div className={cn(cardBgClass, "p-8 shadow-sm flex flex-col relative overflow-hidden group rounded-[2rem]")}>
                            <div className="flex items-start justify-between mb-6">
                              <motion.div 
                                animate={{ 
                                  scale: [1, 1.05, 1],
                                  boxShadow: ["0px 0px 0px rgba(255,99,71,0)", "0px 0px 20px rgba(255,99,71,0.4)", "0px 0px 0px rgba(255,99,71,0)"]
                                }}
                                transition={{ 
                                  duration: 2, 
                                  repeat: Infinity, 
                                  ease: "easeInOut" 
                                }}
                                className="bg-primary p-4 rounded-2xl text-white shadow-lg"
                              >
                                <Icon size={28} />
                              </motion.div>
                              {card.emoji && (
                                <motion.div 
                                  animate={{ 
                                    y: [0, -10, 0],
                                    rotate: [0, 5, -5, 0]
                                  }}
                                  transition={{ 
                                    duration: 3, 
                                    repeat: Infinity, 
                                    ease: "easeInOut" 
                                  }}
                                  className="text-5xl drop-shadow-xl"
                                >
                                  {card.emoji}
                                </motion.div>
                              )}
                            </div>
                            <div className="space-y-2 mt-auto">
                              <p className={cn(
                                "text-[10px] font-bold uppercase tracking-[0.2em]",
                                subTextColor
                              )}>
                                {card.isDynamicTitle ? (data?.subValue || 'No Data') : (card.title || 'No Title')}
                              </p>
                              <h3 className={cn(
                                "text-4xl font-black tracking-tight",
                                textColor
                              )}>
                                {card.isDynamicContent ? (data?.headline || 'No Data') : (card.content || 'No Content')}
                              </h3>
                              {footer && (
                                <p className={cn(
                                  "text-sm mt-4 font-medium leading-relaxed",
                                  subTextColor
                                )}>
                                  {card.isDynamicFooter ? (data?.details?.join(' • ') || '') : (card.footer || '')}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                        {(card.type === 'heading' || card.type === 'title') && (
                          <div className={cn(
                            "p-6 rounded-[2rem] flex flex-col justify-center",
                            cardBgClass,
                            textColor
                          )}>
                            <h2 className={cn(
                              card.type === 'heading' ? "text-3xl font-black" : "text-xl font-bold",
                              "tracking-tight"
                            )}>
                              {card.isDynamicContent ? data.headline : (card.content || card.title)}
                            </h2>
                            {footer && (
                              <p className={cn("text-xs mt-2 font-medium opacity-80", subTextColor)}>
                                {footer}
                              </p>
                            )}
                          </div>
                        )}
                        {(card.type === 'table' || card.type === 'analytics') && (
                          <div className={cn(cardBgClass, "p-8 shadow-sm flex flex-col relative overflow-hidden group rounded-[2rem]")}>
                            <div className="flex items-center justify-between mb-8">
                              <div className="flex items-center gap-4">
                                <motion.div 
                                  animate={{ 
                                    scale: [1, 1.05, 1],
                                    boxShadow: ["0px 0px 0px rgba(255,99,71,0)", "0px 0px 15px rgba(255,99,71,0.4)", "0px 0px 0px rgba(255,99,71,0)"]
                                  }}
                                  transition={{ 
                                    duration: 2, 
                                    repeat: Infinity, 
                                    ease: "easeInOut" 
                                  }}
                                  className="bg-primary p-3 rounded-2xl text-white shadow-lg shadow-primary/20"
                                >
                                  <Icon size={24} />
                                </motion.div>
                                <div>
                                  <p className={cn(
                                    "text-[10px] font-bold uppercase tracking-[0.2em]",
                                    subTextColor
                                  )}>
                                    {title}
                                  </p>
                                  <h3 className={cn("text-xl font-bold tracking-tight", textColor)}>
                                    {card.type === 'table' ? 'Data Overview' : 'Analytics View'}
                                  </h3>
                                </div>
                              </div>
                            </div>

                            <div className="flex-1 min-h-0 w-full overflow-hidden">
                              {card.type === 'table' ? (
                                <DynamicTable 
                                  dataSource={card.dataSource as any} 
                                  visibleColumns={card.tableConfig?.visibleColumns}
                                  headerColor={textColor}
                                  data={getTableData(card.dataSource, data.rawData)}
                                />
                              ) : (
                                <div className="h-full min-h-[300px] w-full">
                                {data.rawData.length === 0 ? (
                                  <div className="flex items-center justify-center h-[300px] text-slate-400 dark:text-slate-500 font-medium">
                                    No data available
                                  </div>
                                ) : (
                                  <ResponsiveContainer width="100%" height={300}>
                                    {card.analyticsConfig?.chartType === 'bar' ? (
                                      <BarChart data={data.rawData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey={card.analyticsConfig.nameKey} hide />
                                        <YAxis hide />
                                        <Tooltip 
                                          cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                          contentStyle={{ 
                                            backgroundColor: isDark ? '#1e293b' : '#ffffff',
                                            borderRadius: '1rem', 
                                            border: 'none', 
                                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                            color: isDark ? '#f8fafc' : '#1e293b'
                                          }}
                                          itemStyle={{ color: chartColor }}
                                        />
                                        <Bar dataKey={card.analyticsConfig.dataKey || 'value'} fill={chartColor} radius={[4, 4, 0, 0]} />
                                      </BarChart>
                                    ) : card.analyticsConfig?.chartType === 'pie' ? (
                                      <PieChart>
                                        <Pie
                                          data={data.rawData}
                                          cx="50%"
                                          cy="50%"
                                          innerRadius={60}
                                          outerRadius={80}
                                          paddingAngle={5}
                                          dataKey={card.analyticsConfig.dataKey || 'value'}
                                        >
                                          {data.rawData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                          ))}
                                        </Pie>
                                        <Tooltip 
                                          contentStyle={{ 
                                            backgroundColor: isDark ? '#1e293b' : '#ffffff',
                                            borderRadius: '1rem', 
                                            border: 'none', 
                                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                            color: isDark ? '#f8fafc' : '#1e293b'
                                          }}
                                        />
                                      </PieChart>
                                    ) : card.analyticsConfig?.chartType === 'line' ? (
                                      <LineChart data={data.rawData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey={card.analyticsConfig.nameKey} hide />
                                        <YAxis hide />
                                        <Tooltip 
                                          contentStyle={{ 
                                            backgroundColor: isDark ? '#1e293b' : '#ffffff',
                                            borderRadius: '1rem', 
                                            border: 'none', 
                                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                            color: isDark ? '#f8fafc' : '#1e293b'
                                          }}
                                          itemStyle={{ color: chartColor }}
                                        />
                                        <Line type="monotone" dataKey={card.analyticsConfig.dataKey || 'value'} stroke={chartColor} strokeWidth={3} dot={{ r: 4, fill: chartColor }} />
                                      </LineChart>
                                    ) : (
                                      <AreaChart data={data.rawData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                          <linearGradient id={`colorValue-${card.id}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={chartColor} stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
                                          </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey={card.analyticsConfig?.nameKey || 'name'} hide />
                                        <YAxis hide />
                                        <Tooltip 
                                          contentStyle={{ 
                                            backgroundColor: isDark ? '#1e293b' : '#ffffff',
                                            borderRadius: '1rem', 
                                            border: 'none', 
                                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                            color: isDark ? '#f8fafc' : '#1e293b'
                                          }}
                                          itemStyle={{ color: chartColor }}
                                        />
                                        <Area type="monotone" dataKey={card.analyticsConfig?.dataKey || 'value'} stroke={chartColor} fillOpacity={1} fill={`url(#colorValue-${card.id})`} />
                                      </AreaChart>
                                    )}
                                  </ResponsiveContainer>
                                )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        {card.type === 'heading' && (
                          <div className={cn(cardBgClass, "p-8 shadow-sm flex flex-col justify-center relative overflow-hidden group rounded-[2rem]")}>
                            <motion.div 
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 + 0.2 }}
                              className="py-4"
                            >
                              <h2 className={cn("text-3xl font-bold tracking-tight", textColor)}>
                                {title}
                              </h2>
                              {content && <p className="text-slate-500 mt-2">{content}</p>}
                            </motion.div>
                          </div>
                        )}
                        {card.type === 'title' && (
                          <div className={cn(cardBgClass, "p-6 shadow-sm flex flex-col justify-center relative overflow-hidden group rounded-[2rem]")}>
                            <motion.div 
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 + 0.2 }}
                              className="py-2"
                            >
                              <h3 className={cn("text-xl font-semibold", textColor)}>
                                {title}
                              </h3>
                            </motion.div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
          {visibleCards.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-slate-500 dark:text-slate-400">This page is empty. Click "Edit Page" to add content.</p>
            </div>
          )}
        </div>
      )}

      {/* Add Element Modal */}
      <AnimatePresence>
        {editingCardId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setEditingCardId(null)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-8 border border-slate-100 dark:border-slate-800"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Edit Element</h2>
                  <p className="text-slate-500 font-medium mt-1">Customize this specific section</p>
                </div>
                <button 
                  onClick={() => setEditingCardId(null)}
                  className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <CustomPageEditorTable 
                cards={cards.filter(c => c.id === editingCardId)} 
                updateCard={updateCard} 
                removeCard={(id) => { removeCard(id); setEditingCardId(null); }} 
              />
              
              <div className="mt-8 flex justify-start">
                <button 
                  onClick={() => { handleSave(); setEditingCardId(null); }}
                  className="btn-primary"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowAddModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white dark:bg-slate-900 rounded-[3rem] p-8 w-full max-w-3xl shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6">
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Add New Element</h2>
                <p className="text-slate-500 dark:text-slate-400">Choose the type of section you want to add to your page.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { type: 'card', icon: Layout, label: 'Info Card', desc: 'Summary metrics & highlights', color: 'bg-blue-500' },
                  { type: 'table', icon: TableIcon, label: 'Data Table', desc: 'Full records from database', color: 'bg-emerald-500' },
                  { type: 'analytics', icon: BarChart3, label: 'Analytics', desc: 'Charts & data visualizations', color: 'bg-amber-500' },
                  { type: 'heading', icon: Heading, label: 'Main Heading', desc: 'Large section title', color: 'bg-purple-500' },
                  { type: 'title', icon: Type, label: 'Sub Title', desc: 'Smaller section header', color: 'bg-rose-500' },
                ].map((item) => (
                  <button
                    key={item.type}
                    onClick={() => addCard(item.type as any)}
                    className="group p-6 rounded-[2.5rem] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left"
                  >
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4 text-white shadow-lg", item.color)}>
                      <item.icon size={24} />
                    </div>
                    <h4 className="font-bold text-slate-800 dark:text-white mb-1">{item.label}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
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
                <X size={20} />
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
    </div>
  );
};
