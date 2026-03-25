import { useState, useEffect, FormEvent } from 'react';
import { Plus, Trash2, X, Search, Settings2, Edit2 } from 'lucide-react';
import { OrderRecord, OrderField, Employee } from '../types';
import { api } from '../services/api';
import { motion, AnimatePresence } from 'motion/react';
import { PageHeader } from '../components/PageHeader';
import { cn } from '../utils';
import { toast } from 'react-hot-toast';

export const OrderListView = () => {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [activeTab, setActiveTab] = useState<string>('All');
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
      await Promise.all(selectedIds.map(id => api.deleteOrder(id)));
      toast.success(`${selectedIds.length} orders deleted successfully`);
      setSelectedIds([]);
      await fetchData();
    } catch (error) {
      console.error('Failed to delete orders:', error);
      toast.error('Failed to delete some orders');
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [orderDay, setOrderDay] = useState('');
  const [orderedBy, setOrderedBy] = useState('');
  const [orderedTime, setOrderedTime] = useState('');
  const [deliveryDay, setDeliveryDay] = useState('');
  const [category, setCategory] = useState('');
  const [fieldCount, setFieldCount] = useState(1);
  const [dynamicFields, setDynamicFields] = useState<OrderField[]>([{ label: 'Item Name', value: '' }]);

  const startEdit = (order: OrderRecord) => {
    setEditingOrderId(order.id);
    setCategory(order.category);
    setOrderDay(order.orderDay);
    setOrderedBy(order.orderedBy);
    setOrderedTime(order.orderedTime);
    setDeliveryDay(order.deliveryDay);
    setFieldCount(order.fields.length);
    setDynamicFields(order.fields);
    setIsModalOpen(true);
  };

  const categories = ['All', ...Array.from(new Set(orders.map(o => o.category)))];
  const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => {
    const hour = i % 12 || 12;
    const ampm = i < 12 ? 'AM' : 'PM';
    return `${hour}:00 ${ampm}`;
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [orderData, empData] = await Promise.all([
        api.getOrderList(),
        api.getEmployees()
      ]);
      setOrders(orderData);
      setEmployees(empData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFieldCountChange = (count: number) => {
    setFieldCount(count);
    const newFields = [...dynamicFields];
    if (count > newFields.length) {
      for (let i = newFields.length; i < count; i++) {
        newFields.push({ label: `Field ${i + 1}`, value: '' });
      }
    } else {
      newFields.splice(count);
    }
    setDynamicFields(newFields);
  };

  const handleFieldLabelChange = (index: number, label: string) => {
    const newFields = [...dynamicFields];
    newFields[index].label = label;
    setDynamicFields(newFields);
  };

  const handleFieldValueChange = (index: number, value: string) => {
    const newFields = [...dynamicFields];
    newFields[index].value = value;
    setDynamicFields(newFields);
  };

  const handleAddOrder = async (e: FormEvent) => {
    e.preventDefault();
    const orderData: OrderRecord = {
      id: editingOrderId || crypto.randomUUID(),
      category: category || 'Other',
      itemName: (dynamicFields.length > 0 ? dynamicFields[0].value : 'N/A') || 'N/A',
      quantity: 1, // Default quantity for compatibility
      status: 'Pending', // Default status for compatibility
      orderDay,
      orderedBy,
      orderedTime,
      deliveryDay,
      fields: dynamicFields,
    };

    try {
      await api.saveOrder(orderData);
      toast.success(editingOrderId ? 'Order updated successfully!' : 'Order added successfully!');
      await fetchData();
      setIsModalOpen(false);
      resetModal();
    } catch (error: any) {
      console.error('Failed to save order:', error);
      toast.error(error.message || 'Failed to save order');
      setIsModalOpen(false); // Close on failure as requested
      resetModal();
    }
  };

  const resetModal = () => {
    setEditingOrderId(null);
    setOrderDay('');
    setOrderedBy('');
    setOrderedTime('');
    setDeliveryDay('');
    setCategory('');
    setFieldCount(1);
    setDynamicFields([{ label: 'Item Name', value: '' }]);
  };

  const handleDeleteOrder = async (id: string) => {
    try {
      await api.deleteOrder(id);
      toast.success('Order deleted successfully');
      await fetchData();
    } catch (error: any) {
      console.error('Failed to delete order:', error);
      toast.error(error.message || 'Failed to delete order');
    }
  };

  const filteredOrders = orders.filter(o => 
    (activeTab === 'All' || o.category === activeTab) && 
    (
      o.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.orderedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.orderDay.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.deliveryDay.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.fields.some(f => f.label.toLowerCase().includes(searchQuery.toLowerCase()) || f.value.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  );

  // Get unique field labels for the current category to use as table headers
  return (
    <div className="p-0 space-y-2">
      <PageHeader title="Order List">
        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <button 
              onClick={handleBulkDelete}
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all active:scale-95 shrink-0"
            >
              <Trash2 size={18} />
              Delete ({selectedIds.length})
            </button>
          )}
          <button 
            onClick={() => {
              resetModal();
              setIsModalOpen(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all active:scale-95 shrink-0"
          >
            <Plus size={20} />
            Add Order
          </button>
        </div>
      </PageHeader>
      
      <div className="flex gap-[5%] items-center">
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder={`Search ${activeTab} orders...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glass w-full pl-12 pr-4 py-4 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600/20 outline-none font-medium text-slate-900 dark:text-white shadow-sm"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex p-1 glass rounded-xl w-fit overflow-x-auto max-w-full">
          {categories.map(cat => (
            <button 
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${activeTab === cat ? 'bg-white/50 dark:bg-slate-700/50 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="col-span-full text-center py-10 text-slate-400 italic">No {activeTab} orders found.</div>
         ) : filteredOrders.map(order => (
          <div 
            key={order.id} 
            onClick={() => toggleSelect(order.id)}
            className={cn(
              "glass-card p-6 shadow-sm flex flex-col gap-4 relative cursor-pointer group transition-all",
              selectedIds.includes(order.id) ? "ring-2 ring-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10" : "hover:shadow-md"
            )}
          >
            <div 
              className={cn(
                "absolute top-4 right-4 w-5 h-5 rounded border-2 flex items-center justify-center transition-all z-10",
                selectedIds.includes(order.id) ? "bg-indigo-500 border-indigo-500" : "border-slate-300 dark:border-slate-600 opacity-0 group-hover:opacity-100"
              )}
            >
              {selectedIds.includes(order.id) && <Plus size={14} className="text-white rotate-45" />}
            </div>

            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-1">
                {(order.fields || []).map((f, i) => (
                  <div key={i} className="flex flex-col">
                    <span className="font-bold text-indigo-500 dark:text-indigo-400 text-lg">{f.label}</span>
                    <span className="text-slate-800 dark:text-slate-200 font-bold text-sm">{f.value}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                <button 
                  onClick={() => startEdit(order)}
                  className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => handleDeleteOrder(order.id)}
                  className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-auto text-sm font-bold text-slate-800 dark:text-slate-200 grid grid-cols-2 gap-2">
              <p>Staff: <span className="text-indigo-600 dark:text-indigo-400">{order.orderedBy}</span></p>
              <p>Time: <span className="text-indigo-500 dark:text-indigo-400">{order.orderedTime}</span></p>
              <p>Order Day: <span className="text-indigo-500 dark:text-indigo-400">{order.orderDay}</span></p>
              <p>Delivery: <span className="text-emerald-600 dark:text-emerald-400">{order.deliveryDay}</span></p>
            </div>
          </div>
        ))}
      </div>

      {/* Add Order Modal */}
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
              className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 md:p-8 overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{editingOrderId ? 'Edit' : 'Add New'} {activeTab} Order</h3>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleAddOrder} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Category</label>
                      <input 
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        type="text" 
                        placeholder="e.g. Tobacco, Drinks"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-600/20 outline-none font-medium text-slate-900 dark:text-white" 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Order Day</label>
                      <select 
                        value={orderDay}
                        onChange={(e) => setOrderDay(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-600/20 outline-none font-medium text-slate-900 dark:text-white" 
                        required 
                      >
                        <option value="">Select Day</option>
                        {DAYS_OF_WEEK.map(day => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Ordered By</label>
                      <select 
                        value={orderedBy}
                        onChange={(e) => setOrderedBy(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-600/20 outline-none font-medium text-slate-900 dark:text-white"
                        required
                      >
                        <option value="">Select Staff</option>
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.name}>{emp.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Ordered Time</label>
                      <select 
                        value={orderedTime}
                        onChange={(e) => setOrderedTime(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-600/20 outline-none font-medium text-slate-900 dark:text-white" 
                        required 
                      >
                        <option value="">Select Time</option>
                        {TIME_OPTIONS.map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Delivery Day</label>
                      <select 
                        value={deliveryDay}
                        onChange={(e) => setDeliveryDay(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-600/20 outline-none font-medium text-slate-900 dark:text-white" 
                        required 
                      >
                        <option value="">Select Day</option>
                        {DAYS_OF_WEEK.map(day => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Number of Additional Fields</label>
                      <select 
                        value={fieldCount}
                        onChange={(e) => handleFieldCountChange(parseInt(e.target.value))}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-600/20 outline-none font-medium text-slate-900 dark:text-white"
                      >
                        {[...Array(10)].map((_, i) => (
                          <option key={i + 1} value={i + 1}>{i + 1} Field{i > 0 ? 's' : ''}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-slate-400 mb-2">
                      <Settings2 size={16} />
                      <span className="text-xs font-bold uppercase tracking-widest">Order Details Configuration</span>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {dynamicFields.map((field, index) => (
                        <div key={index} className="flex flex-col md:flex-row gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                          <div className="flex-1 space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Field Title</label>
                            <input 
                              value={field.label}
                              onChange={(e) => handleFieldLabelChange(index, e.target.value)}
                              type="text" 
                              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-600/20 outline-none font-bold text-sm text-slate-900 dark:text-white"
                              required
                            />
                          </div>
                          <div className="flex-[2] space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Field Content</label>
                            <input 
                              value={field.value}
                              onChange={(e) => handleFieldValueChange(index, e.target.value)}
                              type="text" 
                              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-600/20 outline-none font-medium text-sm text-slate-900 dark:text-white"
                              required
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 mt-4">
                    <button 
                      type="button"
                      onClick={() => {
                        setIsModalOpen(false);
                        resetModal();
                      }}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 py-4 rounded-xl font-bold text-lg transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="flex-2 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-indigo-600/20"
                    >
                      Save Order Record
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
