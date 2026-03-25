import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { api } from '../services/api';
import { Sale, Transaction, Shift } from '../types';
import { PageHeader } from '../components/PageHeader';
import { BarChart3, TrendingUp, DollarSign, Clock, Download, FileText, Table } from 'lucide-react';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

import { ViewType } from '../types';

interface AnalyticsViewProps {
  onNavigate?: (view: ViewType) => void;
}

export const AnalyticsView = ({ onNavigate }: AnalyticsViewProps) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [roster, setRoster] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [salesData, txData, rosterData] = await Promise.all([
          api.getSales(),
          api.getTransactions(),
          api.getRoster()
        ]);
        setSales(salesData);
        setTransactions(txData);
        setRoster(rosterData);
      } catch (error) {
        console.error('Failed to fetch analytics data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
    window.addEventListener('finance-data-changed', fetchData);
    return () => window.removeEventListener('finance-data-changed', fetchData);
  }, []);

  // Calculate hours per employee
  const calculateHours = (startTime: string, endTime: string) => {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    let hours = endH - startH + (endM - startM) / 60;
    if (hours < 0) hours += 24; // Handle overnight shifts
    return hours;
  };

  const employeeHours = roster.reduce((acc, shift) => {
    const hours = calculateHours(shift.startTime, shift.endTime);
    if (!acc[shift.staffName]) {
      acc[shift.staffName] = { name: shift.staffName, hours: 0, cost: 0 };
    }
    acc[shift.staffName].hours += hours;
    acc[shift.staffName].cost += hours * shift.hourlyRate;
    return acc;
  }, {} as Record<string, { name: string, hours: number, cost: number }>);

  const rosterData = Object.values(employeeHours) as { name: string, hours: number, cost: number }[];
  const totalSalaryExpense = rosterData.reduce((sum, emp) => sum + emp.cost, 0);

  // Calculate other expenses
  const otherExpense = transactions
    .filter(tx => tx.type === 'EXPENSE')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalExpense = totalSalaryExpense + otherExpense;

  const expenseData = [
    { name: 'Salary', value: totalSalaryExpense },
    { name: 'Other Expenses', value: otherExpense }
  ];

  // Calculate sales over time
  const salesByDate = sales.reduce((acc, sale) => {
    if (!acc[sale.date]) {
      acc[sale.date] = { date: sale.date, sales: 0 };
    }
    acc[sale.date].sales += sale.totalSales;
    return acc;
  }, {} as Record<string, { date: string, sales: number }>);

  const salesTrendData = (Object.values(salesByDate) as { date: string, sales: number }[]).sort((a, b) => a.date.localeCompare(b.date));
  const totalSalesRevenue = sales.reduce((sum, sale) => sum + sale.totalSales, 0);
  const totalIncomeTransactions = transactions.filter(tx => tx.type === 'INCOME').reduce((sum, tx) => sum + tx.amount, 0);
  const totalRevenue = totalSalesRevenue + totalIncomeTransactions;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const exportToCSV = () => {
    // Prepare data for CSV
    const headers = ['Date', 'Type', 'Description', 'Category', 'Amount'];
    const rows = transactions.map(tx => [
      tx.date,
      tx.type,
      tx.description,
      tx.category,
      tx.amount.toString()
    ]);

    // Add sales data
    sales.forEach(sale => {
      rows.push([
        sale.date,
        'INCOME',
        `Sales - ${sale.shift}`,
        'Sales',
        sale.totalSales.toString()
      ]);
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `analytics_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text('Analytics Report', 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
    
    // Summary Section
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Financial Summary', 14, 45);
    
    const summaryData = [
      ['Total Revenue', formatCurrency(totalRevenue)],
      ['Total Expenses', formatCurrency(totalExpense)],
      ['Net Profit', formatCurrency(totalRevenue - totalExpense)],
      ['Weekly Hours', `${rosterData.reduce((sum, emp) => sum + emp.hours, 0).toFixed(1)}h`]
    ];

    doc.autoTable({
      startY: 50,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'striped',
      headStyles: { fillStyle: '#4f46e5' }
    });

    // Staff Performance Section
    doc.text('Staff Performance', 14, (doc as any).lastAutoTable.finalY + 15);
    
    const staffData = rosterData.map(emp => [
      emp.name,
      `${emp.hours.toFixed(1)}h`,
      formatCurrency(emp.cost)
    ]);

    doc.autoTable({
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Staff Name', 'Hours Worked', 'Total Cost']],
      body: staffData,
      theme: 'grid',
      headStyles: { fillStyle: '#10b981' }
    });

    doc.save(`analytics_report_${new Date().toISOString().split('T')[0]}.pdf`);
    setShowExportMenu(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <PageHeader title="Analytics">
        <div className="flex items-center gap-3">
          {onNavigate && (
            <button
              onClick={() => onNavigate('Documents')}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl transition-all shadow-sm font-medium"
            >
              <FileText size={18} className="text-indigo-500" />
              View Documents
            </button>
          )}
          <div className="relative">
            <button 
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-lg shadow-indigo-500/20 font-medium"
            >
              <Download size={18} />
              Export Data
            </button>
            
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden">
                <button 
                  onClick={exportToCSV}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200 transition-colors"
                >
                  <Table size={18} className="text-emerald-500" />
                  Export as CSV
                </button>
                <button 
                  onClick={exportToPDF}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200 transition-colors border-t border-slate-100 dark:border-slate-700"
                >
                  <FileText size={18} className="text-rose-500" />
                  Export as PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <TrendingUp size={24} />
            </div>
          </div>
          <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Revenue</h3>
          <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
            {formatCurrency(totalRevenue)}
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <DollarSign size={24} />
            </div>
          </div>
          <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Expenses</h3>
          <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
            {formatCurrency(totalExpense)}
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/50 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock size={24} />
            </div>
          </div>
          <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Weekly Hours</h3>
          <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
            {rosterData.reduce((sum, emp) => sum + emp.hours, 0).toFixed(1)}h
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
              <BarChart3 size={24} />
            </div>
          </div>
          <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Net Profit</h3>
          <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
            {formatCurrency(totalRevenue - totalExpense)}
          </p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Growth */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm"
        >
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Revenue Growth</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesTrendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickMargin={10} />
                <YAxis stroke="#64748b" fontSize={12} tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
                  itemStyle={{ color: '#818cf8' }}
                  formatter={(value: any) => [formatCurrency(value), 'Sales']}
                />
                <Line type="monotone" dataKey="sales" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Expenses Breakdown */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm"
        >
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Weekly Expenses Breakdown</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {expenseData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
                  formatter={(value: any) => [formatCurrency(value), 'Amount']}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Weekly Hour Roster */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm lg:col-span-2"
        >
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Weekly Hour Roster by Employee</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rosterData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickMargin={10} />
                <YAxis stroke="#64748b" fontSize={12} tickFormatter={(value) => `${value}h`} />
                <Tooltip 
                  cursor={{ fill: '#334155', opacity: 0.1 }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl">
                          <p className="text-white font-bold mb-1">{data.name}</p>
                          <p className="text-emerald-400 text-sm">Total Hours: {data.hours.toFixed(1)} hrs</p>
                          <p className="text-indigo-400 text-sm">Total Amount: {formatCurrency(data.cost)}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Bar dataKey="hours" name="Hours" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
