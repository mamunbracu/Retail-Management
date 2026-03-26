import { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, Shield, FileText, DollarSign, CreditCard, PlusCircle, Settings, ArrowLeft, LayoutGrid } from 'lucide-react';
import { AppArchitectureView } from './AppArchitectureView';
import { Employee, ViewType } from '../types';
import { api } from '../services/api';
import { PageHeader } from '../components/PageHeader';
import { toast } from 'react-hot-toast';

interface AdminEmployeesViewProps {
  setActiveView: (view: ViewType) => void;
}

export const AdminEmployeesView = ({ setActiveView }: AdminEmployeesViewProps) => {
  const [showAdminUsers, setShowAdminUsers] = useState(false);
  const [showAppArchitecture, setShowAppArchitecture] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [employeeToReset, setEmployeeToReset] = useState<Employee | null>(null);
  const [newPassword, setNewPassword] = useState('');
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
    try {
      const empData = await api.getEmployees();
      setEmployees(empData);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      toast.error('Failed to load employees');
    }
  };

  useEffect(() => {
    if (showAdminUsers) {
      fetchEmployees();
    }
  }, [showAdminUsers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const employeeData: Employee = {
      id: editingEmployee?.id || crypto.randomUUID(),
      ...formData,
      staffId: Number(formData.staffId) || 0,
      hourlyRate: Number(formData.hourlyRate) || 0,
      joinedDate: editingEmployee?.joinedDate || new Date().toISOString().split('T')[0],
    };
    
    if (!formData.password && editingEmployee) {
      delete employeeData.password;
    }

    try {
      await api.saveEmployee(employeeData);
      toast.success(editingEmployee ? 'Employee updated!' : 'Employee added!');
      setIsModalOpen(false);
      fetchEmployees();
    } catch (error: any) {
      console.error('Failed to save:', error);
      toast.error(error.message || 'Failed to save employee');
      setIsModalOpen(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteEmployee(id);
      toast.success('Employee deleted');
      fetchEmployees();
    } catch (error: any) {
      console.error('Failed to delete:', error);
      toast.error(error.message || 'Failed to delete');
    }
  };

  if (showAdminUsers) {
    return (
      <div className="space-y-6">
        <PageHeader title="Admin Staff Management" onBack={() => setShowAdminUsers(false)}>
          <button 
            onClick={() => { setEditingEmployee(null); setFormData({ staffId: '', name: '', role: 'Staff', email: '', phone: '', bio: '', password: '', hourlyRate: '' }); setIsModalOpen(true); }}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2"
          >
            <Plus size={20} /> Add Staff
          </button>
        </PageHeader>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white">
              <tr>
                <th className="p-4">Staff ID</th>
                <th className="p-4">Name</th>
                <th className="p-4">Role</th>
                <th className="p-4">Rate</th>
                <th className="p-4">Email</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {employees.map(emp => (
                <tr key={emp.id} className="text-slate-900 dark:text-slate-100">
                  <td className="p-4 font-mono text-sm">{emp.staffId}</td>
                  <td className="p-4 font-bold">{emp.name}</td>
                  <td className="p-4">{emp.role}</td>
                  <td className="p-4">${emp.hourlyRate}/hr</td>
                  <td className="p-4">{emp.email}</td>
                  <td className="p-4 flex gap-2">
                    <button onClick={() => { 
                      setEditingEmployee(emp); 
                      setFormData({ 
                        staffId: String(emp.staffId || ''), 
                        name: emp.name || '', 
                        role: emp.role || 'Staff', 
                        email: emp.email || '', 
                        phone: emp.phone || '', 
                        bio: emp.bio || '', 
                        password: '',
                        hourlyRate: String(emp.hourlyRate || '')
                      }); 
                      setIsModalOpen(true); 
                    }} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Edit"><Edit2 size={18} /></button>
                    <button onClick={() => {
                      setEmployeeToReset(emp);
                      setIsPasswordModalOpen(true);
                    }} className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg" title="Reset Password"><Settings size={18} /></button>
                    <button onClick={() => handleDelete(emp.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg" title="Delete"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-8 rounded-3xl w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold">{editingEmployee ? 'Edit Staff' : 'Add Staff'}</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Staff ID</label>
                  <input required placeholder="Staff ID" value={formData.staffId} onChange={e => setFormData({...formData, staffId: e.target.value})} className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Hourly Rate</label>
                  <input required type="number" placeholder="Rate" value={formData.hourlyRate} onChange={e => setFormData({...formData, hourlyRate: e.target.value})} className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Full Name</label>
                <input required placeholder="Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Role</label>
                <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  <option>Admin</option>
                  <option>Manager</option>
                  <option>Senior Staff</option>
                  <option>Staff</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Email</label>
                <input required type="email" placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Phone</label>
                <input placeholder="Phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Bio</label>
                <textarea placeholder="Bio" value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white" rows={3} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Password</label>
                <input type="password" placeholder={editingEmployee ? "Reset Password (leave blank to keep)" : "Password"} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white" />
              </div>
              <div className="flex gap-2 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold">Cancel</button>
                <button type="submit" className="flex-1 p-3 rounded-xl bg-indigo-600 text-white font-bold">Save</button>
              </div>
            </form>
          </div>
        )}

        {isPasswordModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl w-full max-w-md space-y-4">
              <h2 className="text-xl font-semibold">Reset Password for {employeeToReset?.name}</h2>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">New Password</label>
                <input type="password" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white" />
              </div>
              <div className="flex gap-2 pt-4">
                <button type="button" onClick={() => setIsPasswordModalOpen(false)} className="flex-1 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold">Cancel</button>
                <button type="button" onClick={async () => {
                  if (!employeeToReset) return;
                  try {
                    await api.resetPassword(employeeToReset.email, undefined, newPassword);
                    toast.success('Password reset successfully');
                    setIsPasswordModalOpen(false);
                    setNewPassword('');
                  } catch (error) {
                    toast.error('Failed to reset password');
                  }
                }} className="flex-1 p-3 rounded-xl bg-indigo-600 text-white font-bold">Save</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const hubCards = [
    { title: 'Timesheet', icon: FileText, view: 'Timesheet', color: 'bg-blue-500' },
    { title: 'Employees', icon: Users, view: 'Employees', color: 'bg-emerald-500' },
    { title: 'Finance', icon: DollarSign, view: 'Finance', color: 'bg-amber-500' },
    { title: 'Finance Management', icon: DollarSign, view: 'Finance Management', color: 'bg-orange-500' },
    { title: 'Salary', icon: CreditCard, view: 'Salary', color: 'bg-indigo-500' },
    { title: 'Make Roster', icon: PlusCircle, view: 'Make Roster', color: 'bg-rose-500' },
    { title: 'Settings', icon: Settings, view: 'Settings', color: 'bg-slate-500' },
    { title: 'Admin Users', icon: Shield, view: 'AdminUsers', color: 'bg-purple-500' },
    { title: 'App Settings', icon: Settings, view: 'App Settings', color: 'bg-blue-600' },
    { title: 'App Structure', icon: LayoutGrid, view: 'AppArchitectureView', color: 'bg-indigo-500' },
    { title: 'Control Store', icon: Shield, view: 'Control Store', color: 'bg-emerald-600' },
  ];

  if (showAppArchitecture) {
    return (
      <div className="space-y-6">
        <button onClick={() => setShowAppArchitecture(false)} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={20} /> Back to Admin Hub
        </button>
        <PageHeader title="App Structure" />
        <AppArchitectureView />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Admin Hub" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {hubCards.map(card => (
          <button
            key={card.title}
            onClick={() => {
              if (card.view === 'AdminUsers') {
                setShowAdminUsers(true);
              } else if (card.view === 'AppArchitectureView') {
                setShowAppArchitecture(true);
              } else {
                setActiveView(card.view as ViewType);
              }
            }}
            className="bg-white dark:bg-slate-800 p-6 rounded-3xl flex flex-col items-center justify-center gap-4 hover:shadow-md transition-all hover:scale-105 active:scale-95 border border-slate-200 dark:border-slate-700"
          >
            <div className={`${card.color} p-4 rounded-2xl text-white shadow-lg`}>
              <card.icon size={32} />
            </div>
            <span className="font-bold text-slate-900 dark:text-white text-center">{card.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
