import { useState, useEffect, useMemo, FC, FormEvent } from 'react';
import { DollarSign, CheckCircle, XCircle, Search, Plus, Edit2, Trash2 } from 'lucide-react';
import { Shift, Employee, Salary } from '../types';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { cn, calculateHours } from '../utils';
import { PageHeader } from '../components/PageHeader';
import { toast } from 'react-hot-toast';

export const SalaryView: FC<{ onBack?: () => void }> = ({ onBack }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';
  const [activeTab, setActiveTab] = useState<'payroll' | 'records'>('payroll');
  
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Paid' | 'Unpaid'>('All');
  const [publishedUntilDate] = useState<string>(() => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1); // Default to 1 month in the future
    return date.toISOString().split('T')[0];
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [rosterData, employeesData, salariesData] = await Promise.all([
        api.getRoster(),
        api.getEmployees(),
        api.getSalaries()
      ]);
      setShifts(rosterData);
      setEmployees(employeesData);
      setSalaries(salariesData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    console.log('Shifts state changed:', shifts);
  }, [shifts]);

  const filteredShifts = useMemo(() => shifts.filter(shift => {
    const shiftDate = shift.date || new Date().toISOString().split('T')[0]; 
    const isActive = shiftDate <= publishedUntilDate;
    const matchesSearch = shift.staffName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = 
      filterStatus === 'All' || 
      (filterStatus === 'Paid' && shift.isPaid) || 
      (filterStatus === 'Unpaid' && !shift.isPaid);
    return isActive && matchesSearch && matchesFilter && shift.isApproved;
  }), [shifts, searchTerm, filterStatus, publishedUntilDate]);

  // Group shifts by employee for weekly summary
  const employeeSummaries = useMemo(() => employees.map(emp => {
    const empShifts = shifts.filter(s => s.staffName.trim().toLowerCase() === emp.name.trim().toLowerCase() && s.isApproved);
    
    // Total Salary (Forecast): Sum of all approved shifts (future and past).
    const forecastedSalary = empShifts
        .reduce((acc, curr) => acc + (calculateHours(curr.approvedStartTime || curr.startTime, curr.approvedEndTime || curr.endTime) * (curr.hourlyRate || emp.hourlyRate || 0)), 0);

    // Pending Salary (Earned): Sum of all approved shifts that are not yet marked as Paid.
    const pendingSalary = empShifts
        .filter(s => !s.isPaid)
        .reduce((acc, curr) => acc + ((calculateHours(curr.approvedStartTime || curr.startTime, curr.approvedEndTime || curr.endTime) * (curr.hourlyRate || emp.hourlyRate || 0)) - (curr.paidAmount || 0)), 0);
    
    const paidAmount = empShifts.reduce((acc, curr) => acc + (curr.paidAmount || 0), 0);

    return {
      ...emp,
      forecastedSalary,
      pendingSalary,
      paidAmount,
      shiftCount: empShifts.length
    };
  }), [employees, shifts]);

  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [paymentData, setPaymentData] = useState({ paid: 0 });

  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [editingSalary, setEditingSalary] = useState<Salary | null>(null);
  const [salaryFormData, setSalaryFormData] = useState<Partial<Salary>>({
    employee_id: '',
    amount: 0,
    type: 'Paid',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const handleOpenSalaryModal = (salary?: Salary) => {
    if (salary) {
      setEditingSalary(salary);
      setSalaryFormData(salary);
    } else {
      setEditingSalary(null);
      setSalaryFormData({
        employee_id: employees[0]?.id || '',
        amount: 0,
        type: 'Paid',
        date: new Date().toISOString().split('T')[0],
        notes: ''
      });
    }
    setIsSalaryModalOpen(true);
  };

  const handleSaveSalary = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const emp = employees.find(e => e.id === salaryFormData.employee_id);
      const salaryToSave = {
        ...salaryFormData,
        id: editingSalary?.id || crypto.randomUUID(),
        staff_name: emp?.name || 'Unknown'
      } as Salary;
      
      await api.saveSalary(salaryToSave);
      
      if (editingSalary) {
        setSalaries(prev => prev.map(s => s.id === salaryToSave.id ? salaryToSave : s));
        toast.success('Salary record updated');
      } else {
        setSalaries(prev => [...prev, salaryToSave]);
        toast.success('Salary record added');
      }
      setIsSalaryModalOpen(false);
    } catch (error) {
      console.error('Failed to save salary:', error);
      toast.error('Failed to save salary record');
      setIsSalaryModalOpen(false); // Close on failure as requested
    }
  };

  const handleDeleteSalary = async (id: string) => {
    try {
      await api.deleteSalary(id);
      setSalaries(prev => prev.filter(s => s.id !== id));
      toast.success('Salary record deleted');
    } catch (error) {
      console.error('Failed to delete salary:', error);
      toast.error('Failed to delete salary record');
    }
  };

  const handleUpdatePayment = async (employee: any, paid: number) => {
    console.log("Updating payment for employee:", employee);
    try {
      let remainingToPay = paid;
      const employeeShifts = shifts.filter(s => s.staffName.trim().toLowerCase() === employee.name.trim().toLowerCase() && s.isApproved && !s.isPaid);
      
      // Update all shifts first
      const updatedShifts = [...shifts];
      for (const shift of employeeShifts) {
        if (remainingToPay <= 0) break;
        const shiftTotal = calculateHours(shift.approvedStartTime || shift.startTime, shift.approvedEndTime || shift.endTime) * (shift.hourlyRate || employee.hourlyRate || 0);
        const shiftRemaining = shiftTotal - (shift.paidAmount || 0);
        const paymentForShift = Math.min(remainingToPay, shiftRemaining);
        
        const newPaidAmount = (shift.paidAmount || 0) + paymentForShift;
        const updatedShift = { 
          ...shift, 
          isPaid: (newPaidAmount >= shiftTotal ? 1 : 0), 
          paidAmount: newPaidAmount || 0 
        };
        await api.saveShift(updatedShift);
        console.log("Shift saved successfully:", updatedShift.id);
        
        // Update local copy
        const index = updatedShifts.findIndex(s => s.id === shift.id);
        if (index !== -1) {
          updatedShifts[index] = updatedShift;
        }
        
        remainingToPay -= paymentForShift;
      }
      setShifts(updatedShifts);

      // Add transaction
      console.log("Saving transaction...");
      await api.saveTransaction({
        id: crypto.randomUUID(),
        date: new Date().toISOString().split('T')[0],
        description: `Salary Payment - ${employee.name}`,
        category: 'Salary',
        type: 'EXPENSE',
        amount: paid
      });
      console.log("Transaction saved successfully");

      // Add salary record
      const newSalary: Salary = {
        id: crypto.randomUUID(),
        employee_id: employee.id,
        amount: paid,
        type: 'Paid',
        date: new Date().toISOString().split('T')[0],
        notes: `Payroll payment for shifts`,
        staff_name: employee.name
      };
      console.log("Saving salary record:", newSalary);
      await api.saveSalary(newSalary);
      console.log("Salary record saved successfully");
      setSalaries(prev => [...prev, newSalary]);

      setSelectedEmployee(null);
      setPaymentData({ paid: 0 });
      window.dispatchEvent(new Event('finance-data-changed'));
      toast.success('Payment recorded successfully');
    } catch (error) {
      console.error('Failed to update payment:', error);
      toast.error('Failed to record payment');
      // Even if it fails, we should probably close the modal or at least allow the user to try again
      // The user said "pop is not disapearing", so I'll close it.
      setSelectedEmployee(null);
      setPaymentData({ paid: 0 });
    }
  };

  return (
    <div className="space-y-2">
      <PageHeader title="Salary Management" onBack={onBack}>
        <div className="flex gap-2">
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex">
            <button
              onClick={() => setActiveTab('payroll')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                activeTab === 'payroll' ? "bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              )}
            >
              Payroll (Shifts)
            </button>
            <button
              onClick={() => setActiveTab('records')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                activeTab === 'records' ? "bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              )}
            >
              Salary Records
            </button>
          </div>
          {activeTab === 'records' && isAdmin && (
            <button 
              onClick={() => handleOpenSalaryModal()}
              className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-lg shadow-primary/20"
            >
              <Plus size={20} />
              <span className="hidden xs:inline">Add Record</span>
            </button>
          )}
        </div>
      </PageHeader>

      {/* Payment Popup */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-4">Pay Salary for {selectedEmployee.name}</h3>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between"><span>Total Amount:</span> <span>${ selectedEmployee.forecastedSalary.toFixed(2) }</span></div>
              <div className="flex justify-between font-semibold text-indigo-600"><span>Due:</span> <span>${ Math.max(0, selectedEmployee.pendingSalary - (paymentData.paid || 0)).toFixed(2) }</span></div>
            </div>
            <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1 block">Amount to pay</label>
            <input 
              type="number" 
              value={isNaN(paymentData.paid) ? '' : paymentData.paid}
              onChange={(e) => setPaymentData({ paid: parseFloat(e.target.value) })}
              className="w-full p-2 border rounded-lg mb-4"
              placeholder="Amount to pay"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setSelectedEmployee(null)} className="px-4 py-2 bg-slate-200 rounded-lg">Cancel</button>
              <button onClick={() => handleUpdatePayment(selectedEmployee, paymentData.paid)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Pay</button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : activeTab === 'payroll' ? (
        <>
          {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Total Forecasted Salary</p>
          <h3 className="text-3xl font-semibold text-slate-800 dark:text-white">
            ${employeeSummaries.reduce((acc, curr) => acc + curr.forecastedSalary, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </h3>
        </div>
        <div className="glass-card p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">Total Paid Amount</p>
          <h3 className="text-3xl font-semibold text-emerald-500">
            ${employeeSummaries.reduce((acc, curr) => acc + curr.paidAmount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </h3>
        </div>
        <div className="glass-card p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">Pending Earned Salary</p>
          <h3 className="text-3xl font-semibold text-indigo-500">
            ${employeeSummaries.reduce((acc, curr) => acc + curr.pendingSalary, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </h3>
        </div>
      </div>

      {/* Employee Weekly Table */}
      <div className="glass-card shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-lg text-slate-800 dark:text-white">Weekly Employee Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">Employee</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">Shifts</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">Forecasted</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">Paid</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">Pending</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {employeeSummaries.map(emp => (
                <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300">
                        {emp.name[0]}
                      </div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{emp.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 font-medium">{emp.shiftCount}</td>
                  <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">${emp.forecastedSalary.toFixed(2)}</td>
                  <td className="px-6 py-4 font-bold text-emerald-600 dark:text-emerald-400">${emp.paidAmount.toFixed(2)}</td>
                  <td className="px-6 py-4 font-bold text-indigo-600 dark:text-indigo-400">${emp.pendingSalary.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      disabled={emp.pendingSalary <= 0}
                      onClick={() => {
                        setSelectedEmployee(emp);
                        setPaymentData({ paid: 0 });
                      }}
                      className={cn(
                        "p-2 rounded-xl transition-all",
                        emp.pendingSalary <= 0 
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600" 
                          : "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400 hover:bg-indigo-200"
                      )}
                    >
                      <DollarSign size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Individual Shift Details */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">Shift Payment Details</h3>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
              />
            </div>
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none"
            >
              <option value="All">All Status</option>
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredShifts.map((shift) => {
              const start = shift.approvedStartTime || shift.startTime;
              const end = shift.approvedEndTime || shift.endTime;
              const hours = calculateHours(start, end);
              const amount = hours * (shift.hourlyRate || 25);
              
              return (
                <div
                  key={shift.id}
                  className={cn(
                    "p-5 rounded-3xl border transition-all bg-[rgb(21,26,45)]",
                    shift.isPaid 
                      ? "border-emerald-900/30" 
                      : "border-slate-800 shadow-sm"
                  )}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-semibold text-white">
                        {shift.staffName[0]}
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">{shift.staffName}</h4>
                        <p className="text-xs text-[tomato] font-medium">{shift.day} <span className="text-slate-400 ml-1">({shift.date})</span></p>
                      </div>
                    </div>
                    <div className={cn(
                        "p-2 rounded-xl transition-all",
                        shift.isPaid 
                          ? "bg-emerald-900/40 text-[green]" 
                          : "bg-slate-800 text-[tomato]"
                      )}>
                      {shift.isPaid ? <CheckCircle size={20} /> : <XCircle size={20} />}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-[tomato] font-medium">Time</span>
                      <span className="text-white font-semibold">{start} - {end} ({hours}h)</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[tomato] font-medium">Rate</span>
                      <span className="text-white font-semibold">${shift.hourlyRate || 25}/hr</span>
                    </div>
                    <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                      <span className="text-xs font-semibold uppercase tracking-widest text-[tomato]">Total Amount</span>
                      <span className="text-xl font-semibold text-white">${amount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        {filteredShifts.length === 0 && !isLoading && (
          <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
            <DollarSign size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-400 font-medium">No shifts found matching your criteria.</p>
          </div>
        )}
      </div>
        </>
      ) : (
        <div className="glass-card shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white">Salary Records</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">Date</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">Employee</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">Amount</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">Type</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">Notes</th>
                  {isAdmin && <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {salaries.map(salary => {
                  const emp = employees.find(e => e.id === salary.employee_id);
                  return (
                    <tr key={salary.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 font-medium">{salary.date}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300">
                            {(emp?.name || salary.staff_name || '?')[0]}
                          </div>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{emp?.name || salary.staff_name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">${salary.amount.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-xs font-bold",
                          salary.type === 'Paid' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" :
                          salary.type === 'Due' ? "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400" :
                          "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400"
                        )}>
                          {salary.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{salary.notes || '-'}</td>
                      {isAdmin && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleOpenSalaryModal(salary)}
                              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-blue-500 transition-colors"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeleteSalary(salary.id)}
                              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
                {salaries.length === 0 && (
                  <tr>
                    <td colSpan={isAdmin ? 6 : 5} className="px-6 py-8 text-center text-slate-500">
                      No salary records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Salary Modal */}
      {isSalaryModalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl w-full max-w-md">
            <h3 className="text-xl font-bold mb-6">{editingSalary ? 'Edit Salary Record' : 'Add Salary Record'}</h3>
            <form onSubmit={handleSaveSalary} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1 block">Employee</label>
                <select 
                  required
                  value={salaryFormData.employee_id}
                  onChange={e => setSalaryFormData({...salaryFormData, employee_id: e.target.value})}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                >
                  <option value="" disabled>Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1 block">Amount ($)</label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    step="0.01"
                    value={isNaN(salaryFormData.amount as number) ? '' : salaryFormData.amount}
                    onChange={e => setSalaryFormData({...salaryFormData, amount: parseFloat(e.target.value)})}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1 block">Type</label>
                  <select 
                    required
                    value={salaryFormData.type}
                    onChange={e => setSalaryFormData({...salaryFormData, type: e.target.value as any})}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Due">Due</option>
                    <option value="Bonus">Bonus</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1 block">Date</label>
                <input 
                  type="date" 
                  required
                  value={salaryFormData.date}
                  onChange={e => setSalaryFormData({...salaryFormData, date: e.target.value})}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1 block">Notes (Optional)</label>
                <textarea 
                  value={salaryFormData.notes}
                  onChange={e => setSalaryFormData({...salaryFormData, notes: e.target.value})}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setIsSalaryModalOpen(false)}
                  className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-3 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl transition-colors shadow-lg shadow-primary/20"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
