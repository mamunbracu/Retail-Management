import { useState, useEffect, MouseEvent, FormEvent } from 'react';
import { Users, Plus, Search, Mail, Phone, Calendar, Edit2, Trash2, X, DollarSign, User, ArrowLeft, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Employee, Shift, Sale } from '../types';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/PageHeader';
import { cn, calculateHours } from '../utils';

import { toast } from 'react-hot-toast';

interface EmployeesViewProps {
  onViewProfile?: (id: string) => void;
  onBack?: () => void;
}

export const EmployeesView = ({ onViewProfile, onBack }: EmployeesViewProps) => {
  const { isAdmin } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roster, setRoster] = useState<Shift[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const toggleSelect = (id: string, e: MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      await Promise.all(selectedIds.map(id => api.deleteEmployee(id)));
      toast.success(`${selectedIds.length} employees deleted successfully`);
      setSelectedIds([]);
      await fetchEmployees();
    } catch (error) {
      console.error('Failed to delete employees:', error);
      toast.error('Failed to delete some employees');
    }
  };

  // Form state
  const [formData, setFormData] = useState({
    staffId: '',
    name: '',
    role: 'Staff',
    email: '',
    phone: '',
    bio: '',
    password: '',
    hourlyRate: '',
  });

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const [empData, rosterData, salesData] = await Promise.all([
        api.getEmployees(),
        api.getRoster(),
        api.getSales()
      ]);
      setEmployees(empData);
      setRoster(rosterData);
      setSales(salesData);
    } catch (error: any) {
      console.error('Failed to fetch data:', error);
      toast.error(`Failed to load employees: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleOpenModal = (employee?: Employee) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        staffId: String(employee.staffId || ''),
        name: employee.name,
        role: employee.role,
        email: employee.email,
        phone: employee.phone,
        bio: employee.bio,
        password: '', // Don't show existing password
        hourlyRate: String(employee.hourlyRate || ''),
      });
    } else {
      setEditingEmployee(null);
      setFormData({ staffId: '', name: '', role: 'Staff', email: '', phone: '', bio: '', password: '', hourlyRate: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const employeeData: Employee = {
      id: editingEmployee?.id || crypto.randomUUID(),
      ...formData,
      staffId: Number(formData.staffId) || 0,
      hourlyRate: Number(formData.hourlyRate) || 0,
      joinedDate: editingEmployee?.joinedDate || new Date().toISOString().split('T')[0],
    };
    
    if (!formData.password && editingEmployee) {
      // Keep existing password if not changed
      delete employeeData.password;
    }

    try {
      await api.saveEmployee(employeeData);
      toast.success(editingEmployee ? 'Employee updated successfully!' : 'Employee added successfully!');
      await fetchEmployees();
      setIsModalOpen(false);
    } catch (error: any) {
      console.error('Failed to save employee:', error);
      toast.error(error.message || 'Failed to save employee');
      setIsModalOpen(false);
    }
  };

  const handleDelete = async (id: string, e: MouseEvent) => {
    e.stopPropagation(); // Prevent opening modal
    try {
      await api.deleteEmployee(id);
      toast.success('Employee deleted successfully');
      await fetchEmployees();
    } catch (error: any) {
      console.error('Failed to delete employee:', error);
      toast.error(error.message || 'Failed to delete employee');
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Employees" />

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
              onClick={() => handleOpenModal()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20 text-xs"
            >
              <Plus size={14} />
              Add Employee
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-[5%] items-center">
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search employees by name or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="glass w-full pl-12 pr-4 py-4 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          <AnimatePresence mode="popLayout">
            {filteredEmployees.map((emp) => (
              <motion.div
                key={emp.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={() => setSelectedEmployee(emp)}
                className={cn(
                  "glass-card overflow-hidden shadow-sm hover:shadow-md transition-all group cursor-pointer relative",
                  selectedEmployee?.id === emp.id ? "ring-2 ring-primary" : "",
                  selectedIds.includes(emp.id) ? "bg-primary/5" : ""
                )}
              >
                <div 
                  onClick={(e) => isAdmin && toggleSelect(emp.id, e)}
                  className={cn(
                    "absolute top-2 left-2 w-3.5 h-3.5 rounded border flex items-center justify-center transition-all z-10",
                    selectedIds.includes(emp.id) ? "bg-primary border-primary" : "border-slate-300 dark:border-slate-600 opacity-0 group-hover:opacity-100",
                    !isAdmin && "hidden"
                  )}
                >
                  {selectedIds.includes(emp.id) && <Plus size={10} className="text-white rotate-45" />}
                </div>

                <div className="p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg font-bold text-slate-600 dark:text-slate-300">
                      {emp.name[0]}
                    </div>
                    {isAdmin && (
                      <div className="flex gap-0.5">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleOpenModal(emp); }}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-blue-500 transition-colors"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button 
                          onClick={(e) => handleDelete(emp.id, e)}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-indigo-500 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white truncate">{emp.name}</h3>
                  <p className="text-primary font-bold text-[9px] uppercase tracking-wider mt-0.5">{emp.role}</p>
                  
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[9px] text-slate-500 dark:text-slate-400 font-medium truncate">
                      <Mail size={10} className="text-slate-400 shrink-0" />
                      {emp.email}
                    </div>
                    <div className="flex items-center gap-1.5 text-[9px] text-slate-500 dark:text-slate-400 font-medium truncate">
                      <Phone size={10} className="text-slate-400 shrink-0" />
                      {emp.phone}
                    </div>
                    {isAdmin && (
                      <div className="flex items-center gap-1.5 text-[9px] font-bold text-indigo-600 dark:text-indigo-400">
                        <DollarSign size={10} />
                        ${emp.hourlyRate || 0}/hr
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <p className="text-[9px] text-slate-500 dark:text-slate-400 line-clamp-1 italic max-w-[65%]">
                      {emp.bio || 'No bio provided.'}
                    </p>
                    {onViewProfile && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); onViewProfile(emp.id); }}
                        className="text-[9px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                      >
                        Profile <User size={10} />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {filteredEmployees.length === 0 && !isLoading && (
        <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
          <Users size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-bold text-slate-400">No employees found</h3>
          <p className="text-slate-400 mt-2">Try adjusting your search or add a new employee.</p>
        </div>
      )}

      {selectedEmployee && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl mt-8 border border-slate-200 dark:border-slate-800"
          >
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-2xl font-bold text-white">
                  {selectedEmployee.name[0]}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{selectedEmployee.name}</h3>
                  <p className="text-indigo-600 dark:text-indigo-400 font-bold text-sm uppercase tracking-wider">{selectedEmployee.role}</p>
                </div>
              </div>
            <div className="flex gap-2">
              {onViewProfile && (
                <button 
                  onClick={() => onViewProfile(selectedEmployee.id)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                  <User size={16} /> View Full Profile
                </button>
              )}
              <button 
                onClick={() => handleOpenModal(selectedEmployee)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors flex items-center gap-2"
              >
                <Edit2 size={16} /> Update Details
              </button>
              <button onClick={() => setSelectedEmployee(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400">
                <X size={24} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
              <div className="glass-card p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Total Hours</p>
                <p className="text-xl font-bold text-slate-800 dark:text-white">
                  {roster.filter(s => s.staffName === selectedEmployee.name).reduce((acc, curr) => acc + calculateHours(curr.startTime, curr.endTime), 0).toFixed(1)}h
                </p>
              </div>
              {isAdmin && (
                <>
                  <div className="glass-card p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Total Earnings</p>
                    <p className="text-xl font-bold text-emerald-600">
                      ${roster.filter(s => s.staffName === selectedEmployee.name).reduce((acc, curr) => acc + (calculateHours(curr.startTime, curr.endTime) * curr.hourlyRate), 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="glass-card p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Hourly Rate</p>
                    <p className="text-xl font-bold text-indigo-600">
                      ${roster.find(s => s.staffName === selectedEmployee.name)?.hourlyRate || 0}/hr
                    </p>
                  </div>
                </>
              )}
              <div className="glass-card p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Total Sales</p>
                <p className="text-xl font-bold text-amber-600">
                  ${sales.filter(s => s.addedBy === selectedEmployee.name).reduce((acc, curr) => acc + curr.totalSales, 0).toFixed(2)}
                </p>
              </div>
              <div className="glass-card p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Upcoming Shifts</p>
                <p className="text-xl font-bold text-purple-600">
                  {roster.filter(s => s.staffName === selectedEmployee.name).length}
                </p>
              </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h4 className="font-bold text-lg mb-4 text-slate-800 dark:text-white flex items-center gap-2">
                <Calendar size={20} className="text-primary" />
                Upcoming Shifts
              </h4>
              <div className="space-y-3">
                {(() => {
                  const today = new Date().toISOString().split('T')[0];
                  const upcoming = roster
                    .filter(s => s.staffName === selectedEmployee.name && s.date >= today)
                    .sort((a, b) => a.date.localeCompare(b.date));
                  
                  return upcoming.length > 0 ? (
                    upcoming.map(shift => (
                      <div key={shift.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200">{shift.day}, {shift.date}</p>
                          <p className="text-xs text-slate-400">{shift.startTime} - {shift.endTime}</p>
                        </div>
                        <div className="text-right">
                          {isAdmin && (
                            <>
                              <p className="font-bold text-slate-700 dark:text-slate-300">${(calculateHours(shift.startTime, shift.endTime) * (shift.hourlyRate || selectedEmployee.hourlyRate || 0)).toFixed(2)}</p>
                              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">${shift.hourlyRate || selectedEmployee.hourlyRate || 0}/hr</p>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400 italic">No upcoming shifts assigned.</p>
                  );
                })()}
              </div>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4 text-slate-800 dark:text-white flex items-center gap-2">
                <Clock size={20} className="text-indigo-600" />
                Recent Shifts
              </h4>
              <div className="space-y-3">
                {(() => {
                  const today = new Date().toISOString().split('T')[0];
                  const recent = roster
                    .filter(s => s.staffName === selectedEmployee.name && s.date < today)
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .slice(0, 5);
                  
                  return recent.length > 0 ? (
                    recent.map(shift => (
                      <div key={shift.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200">{shift.day}, {shift.date}</p>
                          <p className="text-xs text-slate-400">{shift.startTime} - {shift.endTime}</p>
                        </div>
                        <div className="text-right">
                          {isAdmin && (
                            <>
                              <p className="font-bold text-slate-700 dark:text-slate-300">${(calculateHours(shift.startTime, shift.endTime) * (shift.hourlyRate || selectedEmployee.hourlyRate || 0)).toFixed(2)}</p>
                              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">${shift.hourlyRate || selectedEmployee.hourlyRate || 0}/hr</p>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400 italic">No recent shifts recorded.</p>
                  );
                })()}
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h4 className="font-bold text-lg mb-4 text-slate-800 dark:text-white flex items-center gap-2">
              <DollarSign size={20} className="text-emerald-600" />
              Recent Sales Activity
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sales.filter(s => s.addedBy === selectedEmployee.name).length > 0 ? (
                sales.filter(s => s.addedBy === selectedEmployee.name).slice(0, 6).map(sale => (
                  <div key={sale.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{sale.date}</p>
                      <p className="text-xs text-slate-400">{sale.shift} Shift</p>
                    </div>
                    <p className="font-bold text-emerald-600">${sale.totalSales.toFixed(2)}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400 italic col-span-2">No sales recorded.</p>
              )}
            </div>
          </div>
        </motion.div>
      )}

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
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 md:p-8 overflow-y-auto">
                <div className="flex justify-between items-center mb-6 md:mb-8">
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{editingEmployee ? 'Employee Profile' : 'New Employee'}</h3>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Staff ID</label>
                      <input 
                        required
                        type="text" 
                        value={formData.staffId}
                        onChange={e => setFormData({...formData, staffId: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-600/20 outline-none font-medium text-slate-900 dark:text-white"
                        placeholder="1001"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Hourly Rate</label>
                      <input 
                        required
                        type="number" 
                        value={formData.hourlyRate}
                        onChange={e => setFormData({...formData, hourlyRate: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-600/20 outline-none font-medium text-slate-900 dark:text-white"
                        placeholder="30"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Full Name</label>
                    <input 
                      required
                      type="text" 
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-600/20 outline-none font-medium text-slate-900 dark:text-white"
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Role</label>
                    <select 
                      required
                      value={formData.role}
                      onChange={e => setFormData({...formData, role: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-600/20 outline-none font-medium text-slate-900 dark:text-white appearance-none"
                    >
                      <option value="Manager">Manager</option>
                      <option value="Senior Staff">Senior Staff</option>
                      <option value="Staff">Staff</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Email</label>
                      <input 
                        required
                        type="email" 
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-600/20 outline-none font-medium text-slate-900 dark:text-white"
                        placeholder="john@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Phone</label>
                      <input 
                        required
                        type="tel" 
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-600/20 outline-none font-medium text-slate-900 dark:text-white"
                        placeholder="0400 000 000"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Bio</label>
                    <textarea 
                      value={formData.bio}
                      onChange={e => setFormData({...formData, bio: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-600/20 outline-none font-medium h-24 resize-none text-slate-900 dark:text-white"
                      placeholder="Tell us a bit about them..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400">
                      {editingEmployee ? 'New Password (leave blank to keep current)' : 'Password'}
                    </label>
                    <input 
                      type="password" 
                      required={!editingEmployee}
                      value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-600/20 outline-none font-medium text-slate-900 dark:text-white"
                      placeholder="••••••••"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-indigo-600/20 mt-4"
                  >
                    {editingEmployee ? 'Update Profile' : 'Create Profile'}
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
