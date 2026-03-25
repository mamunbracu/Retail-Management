import { useState, useEffect } from 'react';
import { Users, DollarSign, TrendingUp, Clock, Star, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Employee, Sale, Shift, AppSettings, OrderRecord } from '../types';
import * as LucideIcons from 'lucide-react';
import { api } from '../services/api';
import { PageHeader } from '../components/PageHeader';
import { calculateHours, cn, isShiftInProgress } from '../utils';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
// Vercel deployment optimization - v1.0.4

export const DashboardView: React.FC = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [roster, setRoster] = useState<Shift[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        console.log('Fetching dashboard data...');
        const [empData, salesData, rosterData, settingsData, ordersData] = await Promise.allSettled([
          api.getEmployees(),
          api.getSales(),
          api.getRoster(),
          api.getAppSettings(),
          api.getOrderList()
        ]);
        
        if (empData.status === 'fulfilled') setEmployees(empData.value);
        else console.error('Failed to fetch employees:', empData.reason);
        
        if (salesData.status === 'fulfilled') setSales(salesData.value);
        else console.error('Failed to fetch sales:', salesData.reason);
        
        if (rosterData.status === 'fulfilled') setRoster(rosterData.value);
        else console.error('Failed to fetch roster:', rosterData.reason);

        if (settingsData.status === 'fulfilled') setAppSettings(settingsData.value);
        else console.error('Failed to fetch settings:', settingsData.reason);

        if (ordersData.status === 'fulfilled') setOrders(ordersData.value);
        else console.error('Failed to fetch orders:', ordersData.reason);
        
        const failed = [empData, salesData, rosterData, settingsData, ordersData].filter(r => r.status === 'rejected');
        if (failed.length > 0) {
          toast.error(`Failed to fetch some dashboard data. Check console for details.`);
        }
        
      } catch (error: any) {
        console.error('Unexpected error fetching dashboard data:', error);
        toast.error(`Error: ${error.message || 'Failed to connect to server'}`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const todaySales = sales
    .filter(s => s.date === today)
    .reduce((acc, curr) => acc + curr.totalSales, 0);

  const totalEarned = roster.reduce((acc, curr) => {
    const emp = employees.find(e => e.name === curr.staffName);
    return acc + (calculateHours(curr.startTime, curr.endTime) * (curr.hourlyRate || emp?.hourlyRate || 0));
  }, 0);

  const totalPaid = roster.reduce((acc, curr) => {
    const emp = employees.find(e => e.name === curr.staffName);
    const shiftTotal = calculateHours(curr.startTime, curr.endTime) * (curr.hourlyRate || emp?.hourlyRate || 0);
    const isPaid = !!curr.isPaid;
    return acc + (curr.paidAmount || (isPaid ? shiftTotal : 0));
  }, 0);
  const outstandingSalary = totalEarned - totalPaid;

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDay = days[new Date().getDay()];
  
  const filteredRoster = roster.filter(s => 
    s.status === 'Published' || 
    s.isApproved || 
    user?.role === 'Admin' || 
    user?.role === 'Manager'
  );

  const upcomingShifts = filteredRoster
    .filter(shift => shift.date === today)
    .sort((a, b) => {
      const aInProgress = isShiftInProgress(a);
      const bInProgress = isShiftInProgress(b);
      if (aInProgress && !bInProgress) return -1;
      if (!aInProgress && bInProgress) return 1;
      return a.startTime.localeCompare(b.startTime);
    });

  // Simple performance metric: average sales per shift compared to a target
  const targetSale = 500;
  const averageSale = sales.length > 0 ? sales.reduce((acc, curr) => acc + curr.totalSales, 0) / sales.length : 0;
  const performanceValue = Math.min(Math.round((averageSale / targetSale) * 100), 100);

  const yesterday = new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0];
  const yesterdaySales = sales
    .filter(s => s.date === yesterday)
    .reduce((acc, curr) => acc + curr.totalSales, 0);
  
  const salesTrend = yesterdaySales > 0 ? ((todaySales - yesterdaySales) / yesterdaySales) * 100 : 0;

  const salesByEmployee = sales.reduce((acc, curr) => {
    acc[curr.addedBy] = (acc[curr.addedBy] || 0) + curr.totalSales;
    return acc;
  }, {} as Record<string, number>);
  const bestEmployee = Object.entries(salesByEmployee).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  const todayOrdersList = orders.filter(o => o.orderDay === currentDay);
  const todayOrdersToPlace = todayOrdersList.length > 0
    ? todayOrdersList.map(o => o.category).join(', ')
    : 'No orders today';

  const todayDeliveriesList = orders.filter(o => o.deliveryDay === currentDay);
  const todayDeliveries = todayDeliveriesList.length > 0
    ? todayDeliveriesList.map(o => `${o.category} (${o.orderedBy}, ${currentDay})`).join(', ')
    : 'No delivery today';
  
  const nextOrder = todayOrdersList.sort((a, b) => a.orderedTime.localeCompare(b.orderedTime))[0];
  const nextOrderPerson = nextOrder ? nextOrder.orderedBy : 'None';

  const now = new Date();

  const nextShift = roster
    .filter(s => {
      const shiftDate = new Date(s.date);
      const [hours, minutes] = s.startTime.split(':').map(Number);
      shiftDate.setHours(hours, minutes, 0, 0);
      return shiftDate > now;
    })
    .sort((a, b) => {
      const dateA = new Date(a.date);
      const [hA, mA] = a.startTime.split(':').map(Number);
      dateA.setHours(hA, mA, 0, 0);
      
      const dateB = new Date(b.date);
      const [hB, mB] = b.startTime.split(':').map(Number);
      dateB.setHours(hB, mB, 0, 0);
      
      return dateA.getTime() - dateB.getTime();
    })[0];

  const stats = [
    { 
      label: 'Total Employees', 
      value: employees.length.toString(), 
      icon: Users, 
      color: 'bg-primary',
      description: 'Active staff members',
      trend: `${employees.length} active`,
      trendUp: true
    },
    { 
      label: "Today's Sales", 
      value: `$${todaySales.toFixed(2)}`, 
      icon: DollarSign, 
      color: 'bg-primary',
      description: 'Total revenue for today',
      trend: `${salesTrend.toFixed(1)}% vs yesterday`,
      trendUp: salesTrend >= 0
    },
    { 
      label: 'Upcoming Shifts', 
      value: upcomingShifts.length.toString(), 
      icon: Clock, 
      color: 'bg-primary',
      description: `Scheduled for today`,
      trend: nextShift ? `Next: ${nextShift.startTime} (${nextShift.staffName})` : 'No upcoming',
      trendUp: true
    },
    { 
      label: 'Performance', 
      value: `${performanceValue}%`, 
      icon: TrendingUp, 
      color: 'bg-primary',
      description: 'Average vs shift target',
      trend: performanceValue >= 80 ? 'Above target' : 'Below target',
      trendUp: performanceValue >= 80
    },
    { 
      label: 'Outstanding Salary', 
      value: `$${outstandingSalary.toFixed(2)}`, 
      icon: DollarSign, 
      color: 'bg-primary',
      description: 'Total unpaid earnings',
      trend: outstandingSalary > 0 ? 'Review needed' : 'All paid',
      trendUp: outstandingSalary <= 0
    },
  ];

  const getIcon = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName] || LucideIcons.HelpCircle;
    return Icon;
  };

  const dynamicCards = appSettings?.dashboardCards
    .filter(card => card.isVisible)
    .sort((a, b) => a.order - b.order) || [];

  const parseDynamicContent = (content: string) => {
    if (!content) return '';
    return content
      .replace(/{totalEmployees}/g, employees.length.toString())
      .replace(/{todaySales}/g, `$${todaySales.toFixed(2)}`)
      .replace(/{upcomingShifts}/g, upcomingShifts.length.toString())
      .replace(/{performanceValue}/g, `${performanceValue}%`)
      .replace(/{outstandingSalary}/g, `$${outstandingSalary.toFixed(2)}`)
      .replace(/{totalSales}/g, sales.length.toString())
      .replace(/{bestEmployee}/g, bestEmployee)
      .replace(/{todayOrdersToPlace}/g, todayOrdersToPlace.toString())
      .replace(/{todayDeliveries}/g, todayDeliveries.toString())
      .replace(/{nextOrderPerson}/g, nextOrderPerson);
  };

  return (
    <div className="space-y-2">
      <PageHeader title="Dashboard" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-card p-6 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`${stat.color} p-3 rounded-2xl text-white shadow-lg shadow-${stat.color.split('-')[1]}-500/20`}>
                <stat.icon size={24} />
              </div>
              <div className={`flex items-center gap-1 text-xs font-semibold ${stat.trendUp ? 'text-emerald-500' : 'text-indigo-500'}`}>
                {stat.trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {stat.trend}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-3xl font-semibold mt-1 text-slate-800 dark:text-white">{stat.value}</h3>
              <p className="text-xs text-slate-400 mt-2 font-medium">{stat.description}</p>
            </div>
          </motion.div>
        ))}

        {dynamicCards.map((card, index) => {
          const Icon = getIcon(card.icon);
          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (stats.length + index) * 0.1 }}
              className="glass-card p-6 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`${card.color} p-3 rounded-2xl text-white shadow-lg shadow-${card.color.split('-')[1]}-500/20`}>
                  <Icon size={24} />
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{card.title}</p>
                <h3 className="text-xl font-semibold mt-1 text-slate-800 dark:text-white truncate">
                  {card.type === 'dynamic' ? parseDynamicContent(card.content) : card.content}
                </h3>
                <p className="text-xs text-slate-400 mt-2 font-medium">{card.type === 'dynamic' ? 'Live Data' : 'Static Info'}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card p-8 shadow-sm">
          <h3 className="text-xl font-semibold mb-6 flex items-center gap-2 text-slate-800 dark:text-white">
            <Clock className="text-amber-500" />
            Recent Activity
          </h3>
          <div className="space-y-6">
            {isLoading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
              </div>
            ) : sales.length > 0 ? (
              sales.slice(0, 5).map((sale) => (
                <div key={sale.id} className="flex gap-4 items-start">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">New sale of ${sale.totalSales.toFixed(2)} added by {sale.addedBy}</p>
                    <p className="text-xs text-slate-400 mt-1">{sale.date} • {sale.shift} Shift</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400 italic">No recent activity found.</p>
            )}
          </div>
        </div>

        <div className="glass-card p-8 shadow-sm">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-800 dark:text-white">
            <Star className="text-blue-500" />
            Upcoming Shifts
          </h3>
          <div className="space-y-6">
            {isLoading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : upcomingShifts.length > 0 ? (
              upcomingShifts.map((shift) => (
                <div key={shift.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-800">
                      {shift.staffName[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{shift.staffName}</p>
                      <p className="text-xs text-slate-400 font-medium">{shift.startTime} - {shift.endTime}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg",
                      isShiftInProgress(shift)
                        ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                    )}>
                      {isShiftInProgress(shift) ? 'In Progress' : currentDay}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400 italic">No shifts scheduled for today.</p>
            )}
            {employees.length === 0 && !isLoading && (
              <p className="text-sm text-slate-400 italic">No employees added yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
