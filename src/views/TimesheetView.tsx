import { useState, useEffect, useMemo } from 'react';
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Calendar as CalendarIcon,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Save,
  Loader2
} from 'lucide-react';
import { api } from '../services/api';
import { Shift, Salary } from '../types';
import { calculateHours, cn } from '../utils';
import { format, startOfWeek, addDays, subWeeks, addWeeks } from 'date-fns';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/PageHeader';

export const TimesheetView = ({ onBack }: { onBack?: () => void }) => {
  const { user } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending');
  const [editingShiftId, setEditingShiftId] = useState<string | null>(null);
  const [editTimes, setEditTimes] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [saving, setSaving] = useState<string | null>(null);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 6);

  useEffect(() => {
    fetchShifts();
  }, []);

  const fetchShifts = async () => {
    setLoading(true);
    try {
      const data = await api.getRoster();
      setShifts(data);
    } catch (error) {
      toast.error('Failed to fetch shifts');
    } finally {
      setLoading(false);
    }
  };

  const filteredShifts = useMemo(() => {
    return shifts.filter(s => {
      // Date range filter - s.date is "YYYY-MM-DD"
      const [y, m, d] = s.date.split('-').map(Number);
      const shiftDate = new Date(y, m - 1, d);
      shiftDate.setHours(0, 0, 0, 0);

      const start = new Date(weekStart);
      start.setHours(0, 0, 0, 0);
      const end = new Date(weekEnd);
      end.setHours(23, 59, 59, 999);

      const isInWeek = shiftDate >= start && shiftDate <= end;
      if (!isInWeek) return false;

      if (activeTab === 'approved') {
        return s.isApproved === true;
      } else {
        return !s.isApproved;
      }
    });
  }, [shifts, weekStart, weekEnd, activeTab]);

  const handleStartEdit = (shift: Shift) => {
    if (shift.isApproved) {
      toast.error('Approved shifts cannot be edited');
      return;
    }
    if (shift.status !== 'Published') {
      toast.error('Only published shifts can be edited in timesheets');
      return;
    }
    setEditingShiftId(shift.id);
    setEditTimes({
      start: shift.approvedStartTime || shift.startTime,
      end: shift.approvedEndTime || shift.endTime
    });
  };

  const handleSaveTimes = async (shift: Shift) => {
    setSaving(shift.id);
    try {
      const updatedShift: Shift = {
        ...shift,
        approvedStartTime: editTimes.start,
        approvedEndTime: editTimes.end,
      };
      await api.saveShift(updatedShift);
      setShifts(prev => prev.map(s => s.id === shift.id ? updatedShift : s));
      setEditingShiftId(null);
      toast.success('Times updated');
    } catch (error) {
      toast.error('Failed to update times');
    } finally {
      setSaving(null);
    }
  };

  const handleApprove = async (shift: Shift) => {
    setSaving(shift.id);
    try {
      const startTime = shift.approvedStartTime || shift.startTime;
      const endTime = shift.approvedEndTime || shift.endTime;
      const hours = calculateHours(startTime, endTime);
      const amount = hours * (shift.hourlyRate || 25);

      // 1. Update Shift status
      const updatedShift: Shift = {
        ...shift,
        isApproved: true,
        approvedBy: user?.name || 'Manager',
        approvedStartTime: startTime,
        approvedEndTime: endTime,
        status: 'Completed'
      };
      await api.saveShift(updatedShift);

      // 2. Create Salary Record
      const salary: Salary = {
        id: crypto.randomUUID(),
        employee_id: shift.employeeId || '',
        staff_name: shift.staffName,
        amount: amount,
        type: 'Due',
        date: shift.date,
        notes: `Approved shift: ${shift.date} (${startTime}-${endTime})`,
        shift_ids: [shift.id]
      };
      await api.saveSalary(salary);

      setShifts(prev => prev.map(s => s.id === shift.id ? updatedShift : s));
      toast.success(`Shift approved for ${shift.staffName}`);
    } catch (error) {
      console.error('Approval error:', error);
      toast.error('Failed to approve shift');
    } finally {
      setSaving(null);
    }
  };

  const stats = useMemo(() => {
    const weekShifts = shifts.filter(s => {
      const d = new Date(s.date);
      return d >= weekStart && d <= weekEnd;
    });

    const pendingCount = weekShifts.filter(s => !s.isApproved).length;
    const approvedCount = weekShifts.filter(s => s.isApproved).length;
    const totalApprovedPay = weekShifts
      .filter(s => s.isApproved)
      .reduce((sum, s) => {
        const h = calculateHours(s.approvedStartTime || s.startTime, s.approvedEndTime || s.endTime);
        return sum + (h * (s.hourlyRate || 25));
      }, 0);

    return { pendingCount, approvedCount, totalApprovedPay };
  }, [shifts, weekStart, weekEnd]);

  return (
    <div className="space-y-6">
      <PageHeader title="Timesheet Management" />

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
        
        <div className="flex items-center bg-white dark:bg-slate-800 rounded-xl p-1 shadow-sm border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-600 dark:text-slate-300"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="px-3 py-1 text-[10px] font-bold text-slate-700 dark:text-slate-200 min-w-[140px] text-center uppercase tracking-wider">
            {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
          </div>
          <button
            onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-600 dark:text-slate-300"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
              <Clock size={20} />
            </div>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Pending</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.pendingCount}</div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <CheckCircle2 size={20} />
            </div>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Approved</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.approvedCount}</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
              <DollarSign size={20} />
            </div>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Pay</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">${stats.totalApprovedPay.toFixed(2)}</div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="flex border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('pending')}
            className={cn(
              "flex-1 py-4 text-sm font-medium transition-colors border-b-2",
              activeTab === 'pending' 
                ? "text-blue-600 border-blue-600 bg-blue-50/50 dark:bg-blue-900/10" 
                : "text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-700 dark:hover:text-slate-300"
            )}
          >
            Pending ({stats.pendingCount})
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={cn(
              "flex-1 py-4 text-sm font-medium transition-colors border-b-2",
              activeTab === 'approved' 
                ? "text-emerald-600 border-emerald-600 bg-emerald-50/50 dark:bg-emerald-900/10" 
                : "text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-700 dark:hover:text-slate-300"
            )}
          >
            Approved ({stats.approvedCount})
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <th className="px-4 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Staff</th>
                <th className="px-4 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                <th className="px-4 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Day</th>
                <th className="px-4 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Start</th>
                <th className="px-4 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">End</th>
                <th className="px-4 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Hours</th>
                <th className="px-4 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Rate</th>
                <th className="px-4 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Salary</th>
                <th className="px-4 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="animate-spin text-blue-500" size={32} />
                      <span className="text-slate-500 dark:text-slate-400">Loading timesheets...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredShifts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400">
                        <CalendarIcon size={32} />
                      </div>
                      <span className="text-slate-500 dark:text-slate-400">No {activeTab} timesheets found.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredShifts.map((shift) => {
                  const isEditing = editingShiftId === shift.id;
                  const currentStart = isEditing ? editTimes.start : (shift.approvedStartTime || shift.startTime);
                  const currentEnd = isEditing ? editTimes.end : (shift.approvedEndTime || shift.endTime);
                  const hours = calculateHours(currentStart, currentEnd);
                  const salary = hours * (shift.hourlyRate || 25);

                  return (
                    <tr 
                      key={shift.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                            {shift.staffName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white text-xs">{shift.staffName}</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">{shift.status}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-[10px] text-slate-900 dark:text-white font-medium">
                          {(() => {
                            const [y, m, d] = shift.date.split('-').map(Number);
                            return format(new Date(y, m - 1, d), 'MMM d, yyyy');
                          })()}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-[10px] text-slate-900 dark:text-white font-bold">{shift.day}</div>
                      </td>
                      <td className="px-4 py-4">
                        {isEditing ? (
                          <input
                            type="time"
                            value={editTimes.start}
                            onChange={(e) => setEditTimes(prev => ({ ...prev, start: e.target.value }))}
                            className="text-[10px] p-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-slate-900 dark:text-white w-20"
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-medium text-slate-900 dark:text-white">
                              {shift.approvedStartTime || shift.startTime}
                            </span>
                            {shift.status === 'Published' && !shift.isApproved && (
                              <button 
                                onClick={() => handleStartEdit(shift)}
                                className="p-1 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                              >
                                <Clock size={12} />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {isEditing ? (
                          <input
                            type="time"
                            value={editTimes.end}
                            onChange={(e) => setEditTimes(prev => ({ ...prev, end: e.target.value }))}
                            className="text-[10px] p-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-slate-900 dark:text-white w-20"
                          />
                        ) : (
                          <span className="text-[10px] font-medium text-slate-900 dark:text-white">
                            {shift.approvedEndTime || shift.endTime}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                          {hours.toFixed(2)}h
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right text-[10px] text-slate-600 dark:text-slate-400">
                        ${shift.hourlyRate || 25}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="text-[10px] font-bold text-slate-900 dark:text-white">
                          ${salary.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => handleSaveTimes(shift)}
                                disabled={saving === shift.id}
                                className="p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors shadow-sm"
                              >
                                {saving === shift.id ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                              </button>
                              <button
                                onClick={() => setEditingShiftId(null)}
                                className="p-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg transition-colors"
                              >
                                <AlertCircle size={16} />
                              </button>
                            </>
                          ) : shift.isApproved ? (
                            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium text-sm">
                              <CheckCircle2 size={16} />
                              <span>Approved</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleApprove(shift)}
                              disabled={saving === shift.id || shift.status !== 'Published'}
                              className={cn(
                                "px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm",
                                shift.status === 'Published'
                                  ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                              )}
                            >
                              {saving === shift.id ? (
                                <div className="flex items-center gap-2">
                                  <Loader2 size={14} className="animate-spin" />
                                  <span>Approving...</span>
                                </div>
                              ) : (
                                "Approve"
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
