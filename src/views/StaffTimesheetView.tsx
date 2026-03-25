import { useState, useEffect, useMemo } from 'react';
import { 
  Clock, 
  DollarSign, 
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';
import { api } from '../services/api';
import { Shift } from '../types';
import { calculateHours, cn } from '../utils';
import { format, startOfWeek, addDays, subWeeks, addWeeks, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/PageHeader';

// Reference date for fortnightly pay cycle (a Wednesday)
const PAY_CYCLE_START = new Date(2024, 0, 3); // Wednesday, Jan 3, 2024

export const StaffTimesheetView = () => {
  const { user } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'Weekly' | 'Fortnightly'>('Weekly');

  useEffect(() => {
    fetchMyShifts();
  }, []);

  const fetchMyShifts = async () => {
    setLoading(true);
    try {
      const data = await api.getRoster();
      // Filter for current user and approved shifts
      const myApprovedShifts = data.filter(s => 
        s.staffName === user?.name && s.isApproved
      );
      setShifts(myApprovedShifts);
    } catch (error) {
      toast.error('Failed to fetch your timesheet');
    } finally {
      setLoading(false);
    }
  };

  const getFortnightRange = (date: Date) => {
    const diff = date.getTime() - PAY_CYCLE_START.getTime();
    const fortnightMs = 14 * 24 * 60 * 60 * 1000;
    const fortnightsSinceStart = Math.floor(diff / fortnightMs);
    
    const start = new Date(PAY_CYCLE_START.getTime() + (fortnightsSinceStart * fortnightMs));
    const end = new Date(start.getTime() + (13 * 24 * 60 * 60 * 1000));
    const payDate = new Date(end.getTime() + (3 * 24 * 60 * 60 * 1000)); // Wednesday after the fortnight ends (Sunday)
    
    return { start, end, payDate };
  };

  const getWeeklyRange = (date: Date) => {
    const start = startOfWeek(date, { weekStartsOn: 1 }); // Monday
    const end = addDays(start, 6); // Sunday
    return { start, end };
  };

  const currentRange = useMemo(() => {
    if (viewMode === 'Weekly') {
      return getWeeklyRange(currentDate);
    } else {
      return getFortnightRange(currentDate);
    }
  }, [currentDate, viewMode]);

  const filteredShifts = useMemo(() => {
    return shifts.filter(s => {
      const [y, m, d] = s.date.split('-').map(Number);
      const shiftDate = startOfDay(new Date(y, m - 1, d));
      return isWithinInterval(shiftDate, { 
        start: startOfDay(currentRange.start), 
        end: endOfDay(currentRange.end) 
      });
    }).sort((a, b) => a.date.localeCompare(b.date));
  }, [shifts, currentRange]);

  const stats = useMemo(() => {
    const totalHours = filteredShifts.reduce((sum, s) => {
      return sum + calculateHours(s.approvedStartTime || s.startTime, s.approvedEndTime || s.endTime);
    }, 0);
    
    const totalEarnings = filteredShifts.reduce((sum, s) => {
      const h = calculateHours(s.approvedStartTime || s.startTime, s.approvedEndTime || s.endTime);
      return sum + (h * (s.hourlyRate || 25));
    }, 0);

    return { totalHours, totalEarnings, count: filteredShifts.length };
  }, [filteredShifts]);

  const handlePrev = () => {
    if (viewMode === 'Weekly') {
      setCurrentDate(prev => subWeeks(prev, 1));
    } else {
      setCurrentDate(prev => subWeeks(prev, 2));
    }
  };

  const handleNext = () => {
    if (viewMode === 'Weekly') {
      setCurrentDate(prev => addWeeks(prev, 1));
    } else {
      setCurrentDate(prev => addWeeks(prev, 2));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="My Timesheet" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 w-fit">
          <button
            onClick={() => setViewMode('Weekly')}
            className={cn(
              "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
              viewMode === 'Weekly' 
                ? "bg-indigo-600 text-white shadow-md" 
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            )}
          >
            Weekly
          </button>
          <button
            onClick={() => setViewMode('Fortnightly')}
            className={cn(
              "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
              viewMode === 'Fortnightly' 
                ? "bg-indigo-600 text-white shadow-md" 
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            )}
          >
            Fortnightly
          </button>
        </div>

        <div className="flex items-center bg-white dark:bg-slate-800 rounded-xl p-1 shadow-sm border border-slate-200 dark:border-slate-700">
          <button onClick={handlePrev} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-600 dark:text-slate-300">
            <ChevronLeft size={18} />
          </button>
          <div className="px-4 py-1 text-center min-w-[200px]">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {viewMode === 'Weekly' ? 'Week Range' : 'Fortnight Range'}
            </p>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap">
              {format(currentRange.start, 'MMM d')} - {format(currentRange.end, 'MMM d, yyyy')}
            </p>
          </div>
          <button onClick={handleNext} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-600 dark:text-slate-300">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/50 p-4 rounded-2xl flex items-center gap-3">
        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
          <CalendarIcon size={20} />
        </div>
        <div>
          <p className="text-xs font-bold text-indigo-800 dark:text-indigo-300">Payment Date</p>
          <p className="text-sm text-indigo-700 dark:text-indigo-400">
            Estimated payment on <span className="font-bold">Wednesday, {format(viewMode === 'Weekly' ? addDays(currentRange.end, 3) : (currentRange as any).payDate, 'MMMM d, yyyy')}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
              <Clock size={20} />
            </div>
            <span className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Hours</span>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">{stats.totalHours.toFixed(2)}h</div>
          <p className="text-xs text-slate-400 mt-1">Across {stats.count} approved shifts</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <DollarSign size={20} />
            </div>
            <span className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Earnings</span>
          </div>
          <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">${stats.totalEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          <p className="text-xs text-slate-400 mt-1">Based on your hourly rate</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
              <TrendingUp size={20} />
            </div>
            <span className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</span>
          </div>
          <div className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
            <CheckCircle2 className="text-emerald-500" size={20} />
            Approved Only
          </div>
          <p className="text-xs text-slate-400 mt-1">Showing verified timesheets</p>
        </motion.div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Day</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Shift Times</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Hours</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Rate</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Earning</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                  </td>
                </tr>
              ) : filteredShifts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <p className="text-slate-400 italic text-sm">No approved shifts found for this period.</p>
                  </td>
                </tr>
              ) : (
                filteredShifts.map((shift) => {
                  const start = shift.approvedStartTime || shift.startTime;
                  const end = shift.approvedEndTime || shift.endTime;
                  const hours = calculateHours(start, end);
                  const earning = hours * (shift.hourlyRate || 25);

                  return (
                    <tr key={shift.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          {format(new Date(shift.date), 'MMM d, yyyy')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-400">
                          {shift.day}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs font-medium text-slate-600 dark:text-slate-400">
                          {start} - {end}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="text-xs font-bold text-slate-900 dark:text-white">{hours.toFixed(2)}h</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-xs text-slate-500 dark:text-slate-400">${shift.hourlyRate || 25}/hr</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400">${earning.toFixed(2)}</div>
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
