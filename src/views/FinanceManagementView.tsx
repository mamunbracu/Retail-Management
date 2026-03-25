import { useState, useEffect, useMemo, FC } from 'react';
import { Plus, Wallet, TrendingUp, TrendingDown, Search, Trash2, X, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Transaction, Sale, ShiftPeriod } from '../types';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../utils';
import { PageHeader } from '../components/PageHeader';
import { toast } from 'react-hot-toast';

export const FinanceManagementView: FC<{ onBack?: () => void }> = ({ onBack }) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    category: '',
    type: 'INCOME' as 'INCOME' | 'EXPENSE',
    amount: '',
  });

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const [txData, salesData] = await Promise.all([
        api.getTransactions(),
        api.getSales()
      ]);
      setTransactions(txData);
      setSales(salesData);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    const handleFinanceDataChanged = () => fetchTransactions();
    window.addEventListener('finance-data-changed', handleFinanceDataChanged);
    return () => window.removeEventListener('finance-data-changed', handleFinanceDataChanged);
  }, []);

  const handleEdit = (transaction: Transaction) => {
    setFormData({
      date: transaction.date,
      description: transaction.description,
      category: transaction.category,
      type: transaction.type,
      amount: transaction.amount.toString(),
    });
    // Need a way to store the editing transaction ID
    // I'll add a state for editingTransactionId
    setEditingTransactionId(transaction.id);
    setIsModalOpen(true);
  };

  // Add state for editing
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newTransaction: Transaction = {
      id: editingTransactionId || crypto.randomUUID(),
      date: formData.date,
      description: formData.description,
      category: formData.category,
      type: formData.type,
      amount: parseFloat(formData.amount),
      addedBy: user?.name || 'Admin',
    };

    try {
      if (editingTransactionId && editingTransactionId.startsWith('sale-')) {
        const saleId = editingTransactionId.replace('sale-', '');
        const saleToSave: Sale = {
          id: saleId,
          date: formData.date,
          shift: formData.description.replace('Sales - ', '') as ShiftPeriod,
          totalSales: parseFloat(formData.amount),
          addedBy: user?.name || 'Admin',
        };
        await api.saveSale(saleToSave);
      } else {
        await api.saveTransaction(newTransaction);
      }
      await fetchTransactions();
      setIsModalOpen(false);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        description: '',
        category: '',
        type: 'INCOME',
        amount: '',
      });
      setEditingTransactionId(null);
      toast.success('Record saved');
    } catch (error: any) {
      console.error('Failed to save record:', error);
      toast.error(error.message || 'Failed to save record');
      setIsModalOpen(false);
      setEditingTransactionId(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (id.startsWith('sale-')) {
        await api.deleteSale(id.replace('sale-', ''));
      } else {
        await api.deleteTransaction(id);
      }
      await fetchTransactions();
      toast.success('Record deleted');
    } catch (error: any) {
      console.error('Failed to delete transaction:', error);
      toast.error(error.message || 'Failed to delete');
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      await Promise.all(selectedIds.map(id => {
        if (id.startsWith('sale-')) {
          return api.deleteSale(id.replace('sale-', ''));
        } else {
          return api.deleteTransaction(id);
        }
      }));
      toast.success(`${selectedIds.length} records deleted successfully`);
      setSelectedIds([]);
      await fetchTransactions();
    } catch (error) {
      console.error('Failed to delete records:', error);
      toast.error('Failed to delete some records');
    }
  };

  const allTransactions = useMemo(() => {
    const txs: Transaction[] = [...transactions];
    const salesTxs: Transaction[] = sales.map(sale => ({
      id: `sale-${sale.id}`,
      date: sale.date,
      description: `Sales - ${sale.shift}`,
      category: 'Sales',
      type: 'INCOME',
      amount: sale.totalSales
    }));
    return [...txs, ...salesTxs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, sales]);

  const filteredTransactions = allTransactions.filter(t => 
    (t.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.category || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalSalesIncome = sales.reduce((acc, curr) => acc + curr.totalSales, 0);
  const totalIncome = transactions.filter(t => t.type === 'INCOME').reduce((acc, curr) => acc + curr.amount, 0) + totalSalesIncome;
  const totalExpenses = transactions.filter(t => t.type === 'EXPENSE').reduce((acc, curr) => acc + curr.amount, 0);
  const totalBalance = totalIncome - totalExpenses;

  return (
    <div className="space-y-4">
      <PageHeader title="Finance Management" onBack={onBack}>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 sm:px-6 py-3 rounded-full font-semibold flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(91,69,255,0.4)] shrink-0"
          >
            <Plus size={20} />
            <span>Add Transaction</span>
          </button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-card p-6 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center mb-4">
            <Wallet size={24} className="text-indigo-500" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">Total Balance</p>
          <h3 className="text-3xl font-semibold text-slate-900 dark:text-white">${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
        </div>
        <div className="glass-card p-6 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-4">
            <TrendingUp size={24} className="text-emerald-500" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">Total Income</p>
          <h3 className="text-3xl font-semibold text-slate-900 dark:text-white">${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
        </div>
        <div className="glass-card p-6 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 flex items-center justify-center mb-4">
            <TrendingDown size={24} className="text-rose-500" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">Total Expenses</p>
          <h3 className="text-3xl font-semibold text-slate-900 dark:text-white">${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
        </div>
      </div>

      <div className="glass-card shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Recent Transactions</h3>
            {selectedIds.length > 0 && (
              <button 
                onClick={handleBulkDelete}
                className="bg-rose-500 hover:bg-rose-600 text-white px-3 py-1.5 rounded-lg font-bold shadow-lg shadow-rose-500/20 flex items-center gap-2 transition-all active:scale-95 text-sm"
              >
                <Trash2 size={14} />
                Delete ({selectedIds.length})
              </button>
            )}
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 glass border border-slate-200 dark:border-slate-700 rounded-full focus:ring-2 focus:ring-indigo-500/20 outline-none font-medium text-sm text-slate-900 dark:text-white"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <th className="px-6 py-5 w-10">
                  <input 
                    type="checkbox"
                    checked={selectedIds.length === filteredTransactions.length && filteredTransactions.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedIds(filteredTransactions.map(t => t.id));
                      else setSelectedIds([]);
                    }}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                  />
                </th>
                <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Date</th>
                <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Description</th>
                <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Category</th>
                <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Type</th>
                <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 text-right">Amount</th>
                <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                  </td>
                </tr>
              ) : filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction) => (
                  <tr 
                    key={transaction.id} 
                    className={cn(
                      "hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group cursor-pointer",
                      selectedIds.includes(transaction.id) && "bg-indigo-50 dark:bg-indigo-900/20"
                    )}
                    onClick={() => toggleSelect(transaction.id)}
                  >
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox"
                        checked={selectedIds.includes(transaction.id)}
                        onChange={() => toggleSelect(transaction.id)}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-700 dark:text-slate-300">{transaction.date}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-900 dark:text-white">{transaction.description}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {transaction.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        transaction.type === 'INCOME' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'
                      )}>
                        {transaction.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={cn(
                        "font-bold",
                        transaction.type === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      )}>
                        {transaction.type === 'INCOME' ? '+' : '-'}${transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleEdit(transaction)}
                        className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all md:opacity-0 group-hover:opacity-100"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(transaction.id)}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all md:opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-500 dark:text-slate-400 italic">
                    No transactions found.
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
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800"
            >
              <div className="p-6 md:p-8 overflow-y-auto">
                <div className="flex justify-between items-center mb-6 md:mb-8">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Add Transaction</h3>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Type</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, type: 'INCOME'})}
                        className={cn(
                          "py-3 rounded-xl font-bold text-sm transition-all border",
                          formData.type === 'INCOME' 
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/20 dark:border-emerald-500/30 dark:text-emerald-400" 
                            : "bg-white border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400"
                        )}
                      >
                        Income
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, type: 'EXPENSE'})}
                        className={cn(
                          "py-3 rounded-xl font-bold text-sm transition-all border",
                          formData.type === 'EXPENSE' 
                            ? "bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-500/20 dark:border-rose-500/30 dark:text-rose-400" 
                            : "bg-white border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400"
                        )}
                      >
                        Expense
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Date</label>
                    <input 
                      required
                      type="date" 
                      value={formData.date}
                      onChange={e => setFormData({...formData, date: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-medium text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Description</label>
                    <input 
                      required
                      type="text" 
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-medium text-slate-900 dark:text-white"
                      placeholder="e.g. Salary, Utilities, etc."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Category</label>
                    <input 
                      required
                      type="text" 
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-medium text-slate-900 dark:text-white"
                      placeholder="e.g. Sales, Salaries, Rent"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Amount ($)</label>
                    <input 
                      required
                      type="number" 
                      step="0.01"
                      value={formData.amount}
                      onChange={e => setFormData({...formData, amount: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-medium text-slate-900 dark:text-white"
                      placeholder="0.00"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-full font-bold text-lg transition-all shadow-[0_0_15px_rgba(91,69,255,0.4)] mt-4"
                  >
                    Save Transaction
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
