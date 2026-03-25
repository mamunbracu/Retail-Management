import { useState, useEffect, useMemo, FormEvent } from 'react';
import { PageHeader } from '../components/PageHeader';
import { Shift, Employee, DayOfWeek } from '../types';
import { api } from '../services/api';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { Plus, Trash2, Edit2, DollarSign, Clock, ChevronDown, ArrowLeft, X } from 'lucide-react';
import { calculateHours, cn } from '../utils';

export const MakeRosterView = ({ onBack }: { onBack?: () => void }) => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Draft' | 'Published'>('All');
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + 1);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  useEffect(() => {
    fetchData();
  }, [currentWeekStart]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching roster and employees...');
      const [rosterData, empData] = await Promise.all([api.getRoster(), api.getEmployees()]);
      console.log('Roster data:', rosterData);
      console.log('Employees data:', empData);
      setShifts(rosterData);
      setEmployees(empData || []);
    } catch (error) {
      console.error('Failed to load data in MakeRosterView:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };
  const getWeekRange = (start: Date) => {
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start, end };
  };

  const { start: weekStart, end: weekEnd } = getWeekRange(currentWeekStart);

  const changeWeek = (direction: number) => {
    setCurrentWeekStart(prev => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + (direction * 7));
      return next;
    });
  };

  const currentWeekShifts = useMemo(() => {
    return shifts.filter(s => {
        if (!s.date) return false;
        // Robust date parsing: handle ISO strings or YYYY-MM-DD
        const pureDate = s.date.split('T')[0];
        const [y, m, d] = pureDate.split('-').map(Number);
        if (isNaN(y) || isNaN(m) || isNaN(d)) return false;
        
        const shiftDate = new Date(y, m - 1, d);
        shiftDate.setHours(0, 0, 0, 0);
        
        const start = new Date(weekStart);
        start.setHours(0, 0, 0, 0);
        const end = new Date(weekEnd);
        end.setHours(23, 59, 59, 999);
        
        return shiftDate >= start && shiftDate <= end;
    });
  }, [shifts, weekStart, weekEnd]);

  const filteredShifts = useMemo(() => {
    return currentWeekShifts.filter(s => {
        // Status filter
        if (statusFilter !== 'All' && s.status !== statusFilter) return false;
        return true;
    }).sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.startTime.localeCompare(b.startTime);
    });
  }, [currentWeekShifts, statusFilter]);

  const publishedShifts = useMemo(() => filteredShifts.filter(s => s.status === 'Published' || s.isApproved), [filteredShifts]);
  const draftShifts = useMemo(() => filteredShifts.filter(s => s.status === 'Draft' && !s.isApproved), [filteredShifts]);

  const publishedPayroll = useMemo(() => {
    return publishedShifts.reduce((acc, shift) => {
      const start = shift.approvedStartTime || shift.startTime;
      const end = shift.approvedEndTime || shift.endTime;
      const hours = calculateHours(start, end);
      return acc + (hours * (shift.hourlyRate || 25));
    }, 0);
  }, [publishedShifts]);

  const draftPayroll = useMemo(() => {
    return draftShifts.reduce((acc, shift) => {
      const hours = calculateHours(shift.startTime, shift.endTime);
      return acc + (hours * (shift.hourlyRate || 25));
    }, 0);
  }, [draftShifts]);

  const publishedHours = useMemo(() => {
    return publishedShifts.reduce((acc, shift) => {
      const start = shift.approvedStartTime || shift.startTime;
      const end = shift.approvedEndTime || shift.endTime;
      return acc + calculateHours(start, end);
    }, 0);
  }, [publishedShifts]);

  const draftHours = useMemo(() => {
    return draftShifts.reduce((acc, shift) => acc + calculateHours(shift.startTime, shift.endTime), 0);
  }, [draftShifts]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);

  const handleOpenModal = (shift?: Shift) => {
    if (shift?.isApproved) {
      toast.error('Approved shifts cannot be edited');
      return;
    }
    setEditingShift(shift || null);
    setIsModalOpen(true);
  };

  const handleDeleteShift = async (id: string) => {
    const shift = shifts.find(s => s.id === id);
    if (shift?.isApproved) {
      toast.error('Approved shifts cannot be deleted');
      return;
    }
    try {
      await api.deleteShift(id);
      toast.success('Shift deleted!');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete shift');
    }
  };

  const handleSetStatus = async (shift: Shift, newStatus: 'Draft' | 'Published') => {
    if (shift.isApproved) {
      toast.error('Approved shifts cannot be changed');
      return;
    }
    try {
      const updatedShift: Shift = { ...shift, status: newStatus };
      await api.saveShift(updatedShift);
      toast.success(`Shift marked as ${newStatus}!`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleAddOrUpdateShift = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const empId = formData.get('employeeId') as string;
    const emp = employees.find(e => e.id === empId);
    
    const dateStr = formData.get('date') as string;
    // Robust date parsing
    const pureDate = dateStr.split('T')[0];
    const [year, month, day] = pureDate.split('-').map(Number);
    
    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      toast.error('Invalid date format');
      return;
    }
    
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }) as DayOfWeek;

    const newShift: Shift = {
      ...(editingShift || {}),
      id: editingShift?.id || crypto.randomUUID(),
      employeeId: empId,
      staffName: emp?.name || '',
      day: dayOfWeek,
      date: dateStr,
      startTime: formData.get('startTime') as string,
      endTime: formData.get('endTime') as string,
      hourlyRate: Number(formData.get('hourlyRate')) || 25,
      repeatNextWeek: formData.get('repeatNextWeek') === 'on',
      status: formData.get('status') as 'Draft' | 'Published',
    } as Shift;

    try {
      await api.saveShift(newShift);
      toast.success(editingShift ? 'Shift updated!' : 'Shift added!');
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to save shift');
    }
  };

  const handleRepeatRoster = async () => {
    console.log('handleRepeatRoster called');
    if (currentWeekShifts.length === 0) {
      toast.error('No shifts in the current week to repeat. Please add some shifts first.');
      return;
    }

    const loadingToast = toast.loading(`Repeating ${currentWeekShifts.length} shifts for next week...`);
    setIsLoading(true);
    try {
      console.log(`Repeating ${currentWeekShifts.length} shifts for next week`);
      const nextWeekShifts = currentWeekShifts.map(shift => {
        // Robust date parsing: handle ISO strings or YYYY-MM-DD
        const pureDate = shift.date.split('T')[0];
        const [year, month, day] = pureDate.split('-').map(Number);
        
        if (isNaN(year) || isNaN(month) || isNaN(day)) {
          console.error(`Invalid date found in shift: ${shift.date}`);
          throw new Error(`Invalid date: ${shift.date}`);
        }
        
        const date = new Date(year, month - 1, day);
        date.setDate(date.getDate() + 7);
        
        // Format as YYYY-MM-DD manually to avoid timezone issues
        const nextYear = date.getFullYear();
        const nextMonth = String(date.getMonth() + 1).padStart(2, '0');
        const nextDay = String(date.getDate()).padStart(2, '0');
        const nextDateStr = `${nextYear}-${nextMonth}-${nextDay}`;
        
        const nextDayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }) as DayOfWeek;

        // Create a clean new shift object
        const newShift: Shift = {
          id: crypto.randomUUID(),
          employeeId: shift.employeeId,
          staffName: shift.staffName,
          date: nextDateStr,
          day: nextDayOfWeek,
          startTime: shift.startTime,
          endTime: shift.endTime,
          hourlyRate: shift.hourlyRate || 25,
          status: 'Draft',
          repeatNextWeek: shift.repeatNextWeek,
          isApproved: false,
          isPaid: 0,
          paidAmount: 0,
          tasks: shift.tasks || []
        };
        
        console.log(`Prepared repeated shift for ${shift.staffName} on ${nextDateStr}`, newShift);
        return newShift;
      });

      console.log('Starting sequential save of repeated shifts...');
      // Save sequentially to avoid potential race conditions or overwhelming the server
      let successCount = 0;
      for (const s of nextWeekShifts) {
        try {
          await api.saveShift(s);
          successCount++;
          console.log(`Successfully saved repeated shift ${successCount}/${nextWeekShifts.length}`);
        } catch (err) {
          console.error(`Failed to save repeated shift for ${s.staffName}:`, err);
          // Continue with others even if one fails
        }
      }
      
      if (successCount > 0) {
        toast.success(`Successfully repeated ${successCount} shifts for next week!`, { id: loadingToast });
      } else {
        toast.error('Failed to repeat any shifts. Check console for details.', { id: loadingToast });
      }
      
      fetchData();
    } catch (error) {
      console.error('Failed to repeat roster:', error);
      toast.error('Failed to repeat roster', { id: loadingToast });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Make Roster" />
      
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
          <button 
            onClick={handleRepeatRoster}
            disabled={isLoading}
            className={cn(
              "bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl flex items-center justify-center gap-2 font-semibold shadow-lg shadow-emerald-600/20 transition-all text-xs cursor-pointer",
              isLoading && "opacity-50 cursor-not-allowed"
            )}
          >
            {isLoading ? 'Processing...' : 'Repeat Roster for Next Week'}
          </button>
          <button 
            onClick={() => handleOpenModal()} 
            disabled={isLoading}
            className={cn(
              "bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl flex items-center justify-center gap-2 font-semibold shadow-lg shadow-indigo-600/20 transition-all text-xs cursor-pointer",
              isLoading && "opacity-50 cursor-not-allowed"
            )}
          >
            <Plus size={14} /> Add Shift
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <DollarSign size={20} />
            </div>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Published Payroll</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">${publishedPayroll.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
              <DollarSign size={20} />
            </div>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Draft Payroll</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">${draftPayroll.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <Clock size={20} />
            </div>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Published Hours</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{publishedHours.toFixed(1)}h</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
              <Clock size={20} />
            </div>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Draft Hours</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900 dark:text-white">{draftHours.toFixed(1)}h</div>
        </div>
      </div>

      <div className="glass-card p-3 border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3 mb-4">
            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center w-full lg:w-auto">
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl justify-between sm:justify-start">
                  {(['All', 'Draft', 'Published'] as const).map(s => (
                      <button 
                        key={s} 
                        onClick={() => setStatusFilter(s)} 
                        className={cn(
                          "px-2.5 py-1 rounded-lg font-semibold text-[9px] transition-all", 
                          statusFilter === s 
                            ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm" 
                            : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        )}
                      >
                        {s}
                      </button>
                  ))}
                </div>
                
                <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <button onClick={() => changeWeek(-1)} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"><ChevronDown className="rotate-90 text-slate-500" size={12} /></button>
                    <span className="text-[9px] font-semibold text-slate-700 dark:text-slate-300 px-2 whitespace-nowrap">
                        {weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {weekEnd.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                    <button onClick={() => changeWeek(1)} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"><ChevronDown className="-rotate-90 text-slate-500" size={12} /></button>
                </div>
            </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="px-3 py-3 text-[10px] font-semibold uppercase text-slate-400">Day</th>
                <th className="px-3 py-3 text-[10px] font-semibold uppercase text-slate-400">Date</th>
                <th className="px-3 py-3 text-[10px] font-semibold uppercase text-slate-400">Staff</th>
                <th className="px-3 py-3 text-[10px] font-semibold uppercase text-slate-400">Time</th>
                <th className="px-3 py-3 text-[10px] font-semibold uppercase text-slate-400">Hourly Rate</th>
                <th className="px-3 py-3 text-[10px] font-semibold uppercase text-slate-400">Pay</th>
                <th className="px-3 py-3 text-[10px] font-semibold uppercase text-slate-400">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredShifts.map(shift => {
                const isApproved = shift.isApproved;
                const start = shift.approvedStartTime || shift.startTime;
                const end = shift.approvedEndTime || shift.endTime;
                const hours = calculateHours(start, end);
                
                return (
                  <tr key={shift.id} className={cn(
                    "border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors",
                    isApproved && "bg-emerald-50/20 dark:bg-emerald-900/10"
                  )}>
                    <td className="px-3 py-3 text-xs font-bold text-slate-900 dark:text-slate-100">{shift.day}</td>
                    <td className="px-3 py-3 text-[10px] text-slate-600 dark:text-slate-400">{shift.date}</td>
                    <td className="px-3 py-3 text-xs font-bold text-slate-900 dark:text-slate-100">{shift.staffName}</td>
                    <td className="px-3 py-3 text-[10px] text-slate-600 dark:text-slate-400">{start} - {end}</td>
                    <td className="px-3 py-3 text-[10px] text-slate-600 dark:text-slate-400">${shift.hourlyRate || 25}</td>
                    <td className="px-3 py-3 text-xs font-bold text-indigo-600 dark:text-indigo-400">${(hours * (shift.hourlyRate || 25)).toFixed(2)}</td>
                    <td className="px-3 py-3 flex gap-1 items-center">
                      {!isApproved ? (
                        <>
                          <button onClick={() => handleOpenModal(shift)} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="Edit"><Edit2 size={14} /></button>
                          <button onClick={() => handleDeleteShift(shift.id)} className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors" title="Delete"><Trash2 size={14} /></button>
                          <button 
                              onClick={() => handleSetStatus(shift, 'Published')} 
                              className={cn(
                                "px-2 py-1 rounded text-[9px] font-bold transition-colors min-w-[65px]", 
                                shift.status === 'Published' ? "bg-emerald-600 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-emerald-500 hover:text-white"
                              )}
                          >
                              {shift.status === 'Published' ? 'Published' : 'Publish'}
                          </button>
                          <button 
                              onClick={() => handleSetStatus(shift, 'Draft')} 
                              className={cn(
                                "px-2 py-1 rounded text-[9px] font-bold transition-colors min-w-[65px]", 
                                shift.status === 'Draft' ? "bg-amber-600 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-amber-500 hover:text-white"
                              )}
                          >
                              {shift.status === 'Draft' ? 'Drafted' : 'Draft'}
                          </button>
                        </>
                      ) : (
                        <span className="px-3 py-1 bg-emerald-600 text-white rounded text-[9px] font-bold flex items-center gap-1">
                          Approved
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white">{editingShift ? 'Edit Shift' : 'Add Shift'}</h2>
                  <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <X size={20} />
                  </button>
                </div>
                <form key={editingShift?.id || 'new'} onSubmit={handleAddOrUpdateShift} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Date</label>
                      <input 
                        name="date" 
                        type="date" 
                        defaultValue={editingShift?.date || format(new Date(), 'yyyy-MM-dd')} 
                        required 
                        className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-600/20 outline-none font-medium text-slate-900 dark:text-white" 
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Staff Member</label>
                      <select 
                        name="employeeId" 
                        defaultValue={editingShift?.employeeId} 
                        required 
                        className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-600/20 outline-none font-medium text-slate-900 dark:text-white appearance-none"
                      >
                          <option value="">Select Staff</option>
                          {employees.length > 0 ? (
                            employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)
                          ) : (
                            <option disabled>No staff available</option>
                          )}
                      </select>
                      {employees.length === 0 && (
                        <p className="text-[10px] text-amber-600 font-bold mt-1">Warning: No employees found in database.</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Start Time</label>
                        <input 
                          name="startTime" 
                          type="time" 
                          defaultValue={editingShift?.startTime || '09:00'} 
                          required 
                          className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-600/20 outline-none font-medium text-slate-900 dark:text-white" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-400">End Time</label>
                        <input 
                          name="endTime" 
                          type="time" 
                          defaultValue={editingShift?.endTime || '17:00'} 
                          required 
                          className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-600/20 outline-none font-medium text-slate-900 dark:text-white" 
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Hourly Rate ($)</label>
                      <input 
                        name="hourlyRate" 
                        type="number" 
                        defaultValue={editingShift?.hourlyRate || 25} 
                        required 
                        className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-600/20 outline-none font-medium text-slate-900 dark:text-white" 
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Status</label>
                      <select 
                        name="status" 
                        defaultValue={editingShift?.status || 'Draft'} 
                        required 
                        className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-600/20 outline-none font-medium text-slate-900 dark:text-white appearance-none"
                      >
                          <option value="Draft">Draft</option>
                          <option value="Published">Published</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2 py-2">
                      <input 
                        type="checkbox" 
                        name="repeatNextWeek" 
                        id="repeatNextWeek"
                        defaultChecked={editingShift?.repeatNextWeek}
                        className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                      />
                      <label htmlFor="repeatNextWeek" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Repeat Next Week
                      </label>
                    </div>

                    <div className="flex gap-3 mt-6">
                      <button 
                        type="button" 
                        onClick={() => setIsModalOpen(false)} 
                        className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
                      >
                        {editingShift ? 'Update Shift' : 'Add Shift'}
                      </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};
