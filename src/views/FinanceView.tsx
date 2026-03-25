import { useState, useEffect, FormEvent } from 'react';
import { Plus, Calendar, User, Trash2, ArrowUpRight, X, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Sale, ShiftPeriod, Employee } from '../types';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../utils';
import { toast } from 'react-hot-toast';
import { PageHeader } from '../components/PageHeader';

export const FinanceView = ({ onBack }: { onBack?: () => void }) => {
  const { isAdmin } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      await Promise.all(selectedIds.map(id => api.deleteSale(id)));
      toast.success(`${selectedIds.length} records deleted successfully`);
      setSelectedIds([]);
      await fetchSalesAndEmployees();
    } catch (error) {
      console.error('Failed to delete records:', error);
      toast.error('Failed to delete some records');
    }
  };

  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    shift: 'Morning' as ShiftPeriod,
    totalSales: '',
    addedBy: '',
  });

  const fetchSalesAndEmployees = async () => {
    setIsLoading(true);
    try {
      const [salesData, employeesData] = await Promise.all([
        api.getSales(),
        api.getEmployees()
      ]);
      setSales(salesData);
      setEmployees(employeesData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesAndEmployees();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const newSale: Sale = {
      id: crypto.randomUUID(),
      date: formData.date,
      shift: formData.shift,
      totalSales: parseFloat(formData.totalSales),
      addedBy: formData.addedBy || 'Admin',
    };

    try {
      await api.saveSale(newSale);
      await fetchSalesAndEmployees();
      setIsModalOpen(false);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        shift: 'Morning',
        totalSales: '',
        addedBy: '',
      });
      toast.success('Sales record saved');
    } catch (error: any) {
      console.error('Failed to save sale:', error);
      toast.error(error.message || 'Failed to save record');
      setIsModalOpen(false); // Close on failure as requested
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteSale(id);
      setSales(sales.filter(s => s.id !== id));
      toast.success('Record deleted');
    } catch (error: any) {
      console.error('Failed to delete sale:', error);
      toast.error(error.message || 'Failed to delete');
    }
  };

  const totalRevenue = sales.reduce((acc, curr) => acc + curr.totalSales, 0);
  const averageSale = sales.length > 0 ? totalRevenue / sales.length : 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Daily Sales" />

      <div className="flex items-center justify-between gap-4">
        {onBack && (
          <button 
            onClick={onBack}
            className="p-2 bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-xl transition-colors text-slate-900 dark:text-white shadow-sm flex items-center gap-2 font-semibold text-sm"
          >
            <ArrowLeft size={18} />
            Back
          </button>
        )}
        <div className="flex items-center gap-2">
          {isAdmin && selectedIds.length > 0 && (
            <button 
              onClick={handleBulkDelete}
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all active:scale-95 text-xs"
            >
              <Trash2 size={14} />
              Delete ({selectedIds.length})
            </button>
          )}
          {isAdmin && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/20 text-xs"
            >
              <Plus size={14} />
              Add Sales Record
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">Total Revenue</p>
          <h3 className="text-3xl font-semibold text-slate-800 dark:text-white">${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
          <div className="flex items-center gap-1 text-emerald-500 text-xs font-semibold mt-2">
            <ArrowUpRight size={14} />
            <span>+8.2% from last month</span>
          </div>
        </div>
        <div className="glass-card p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">Average Shift Sale</p>
          <h3 className="text-3xl font-semibold text-slate-800 dark:text-white">${averageSale.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
          <div className="flex items-center gap-1 text-emerald-500 text-xs font-semibold mt-2">
            <ArrowUpRight size={14} />
            <span>+2.4% from last month</span>
          </div>
        </div>
        <div className="glass-card p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">Total Records</p>
          <h3 className="text-3xl font-semibold text-slate-800 dark:text-white">{sales.length}</h3>
          <p className="text-xs text-slate-400 mt-2 font-medium">Shift entries logged</p>
        </div>
      </div>

      <div className="glass-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <th className="px-6 py-5 w-10">
                  <input 
                    type="checkbox"
                    checked={selectedIds.length === sales.length && sales.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedIds(sales.map(s => s.id));
                      else setSelectedIds([]);
                    }}
                    className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                  />
                </th>
                <th className="px-6 py-5 text-xs font-semibold uppercase tracking-widest text-slate-400">Date</th>
                <th className="px-6 py-5 text-xs font-semibold uppercase tracking-widest text-slate-400">Shift</th>
                <th className="px-6 py-5 text-xs font-semibold uppercase tracking-widest text-slate-400">Added By</th>
                <th className="px-6 py-5 text-xs font-semibold uppercase tracking-widest text-slate-400">Total Sales</th>
                <th className="px-6 py-5 text-xs font-semibold uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                  </td>
                </tr>
              ) : sales.length > 0 ? (
                sales.map((sale) => (
                  <tr 
                    key={sale.id} 
                    className={cn(
                      "hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group cursor-pointer",
                      selectedIds.includes(sale.id) && "bg-primary/5"
                    )}
                    onClick={() => toggleSelect(sale.id)}
                  >
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox"
                        checked={selectedIds.includes(sale.id)}
                        onChange={() => toggleSelect(sale.id)}
                        className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Calendar size={16} className="text-slate-400" />
                        <span className="font-bold text-slate-800 dark:text-slate-200">{sale.date}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        sale.shift === 'Morning' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                        sale.shift === 'Evening' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' :
                        'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                      )}>
                        {sale.shift}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-slate-400" />
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{sale.addedBy}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-900 dark:text-white">
                        ${sale.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {isAdmin && (
                        <button 
                          onClick={() => handleDelete(sale.id)}
                          className="p-2 text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all md:opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-400 italic">
                    No sales records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 md:p-8 overflow-y-auto">
                <div className="flex justify-between items-center mb-6 md:mb-8">
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Add Sales Record</h3>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Date</label>
                    <input 
                      required
                      type="date" 
                      value={formData.date}
                      onChange={e => setFormData({...formData, date: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none font-medium text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Shift Period</label>
                    <select 
                      required
                      value={formData.shift}
                      onChange={e => setFormData({...formData, shift: e.target.value as ShiftPeriod})}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none font-medium text-slate-900 dark:text-white appearance-none"
                    >
                      <option value="Morning">Morning</option>
                      <option value="Evening">Evening</option>
                      <option value="Whole Day">Whole Day</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Total Sales ($)</label>
                    <input 
                      required
                      type="number" 
                      step="0.01"
                      value={formData.totalSales}
                      onChange={e => setFormData({...formData, totalSales: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none font-medium text-slate-900 dark:text-white"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Added By</label>
                    <select 
                      required
                      value={formData.addedBy}
                      onChange={e => setFormData({...formData, addedBy: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none font-medium text-slate-900 dark:text-white appearance-none"
                    >
                      <option value="" disabled>Select Employee</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.name}>{emp.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-3 mt-4">
                    <button 
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 py-4 rounded-xl font-bold text-lg transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="flex-2 bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-emerald-600/20"
                    >
                      Save Record
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
