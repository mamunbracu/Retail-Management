import { useState, useEffect, useMemo } from 'react';
import { DollarSign, Clock, ChevronDown } from 'lucide-react';
import { Shift } from '../types';
import { calculateHours, cn, isShiftInProgress } from '../utils';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { DAYS_OF_WEEK } from '../constants';
import { motion } from 'motion/react';
import { PageHeader } from '../components/PageHeader';
import { toast } from 'react-hot-toast';

type RosterViewType = 'List' | 'Calendar';

export const RosterView = () => {
  const { user } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewType, setViewType] = useState<RosterViewType>('List');
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + 1); // Start of current week (Monday)
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const getWeekRange = (start: Date) => {
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start, end };
  };

  const changeWeek = (direction: number) => {
    setCurrentWeekStart(prev => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + (direction * 7));
      return next;
    });
  };

  const { start: weekStart, end: weekEnd } = getWeekRange(currentWeekStart);

  const fetchRoster = async () => {
    setIsLoading(true);
    try {
      const rosterData = await api.getRoster();
      setShifts(rosterData);
    } catch (error: any) {
      toast.error(`Failed to load data: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredShifts = useMemo(() => {
    const filtered = shifts.filter(s => {
      const [y, m, d] = s.date.split('-').map(Number);
      const shiftDate = new Date(y, m - 1, d);
      shiftDate.setHours(0, 0, 0, 0);

      const start = new Date(weekStart);
      start.setHours(0, 0, 0, 0);
      const end = new Date(weekEnd);
      end.setHours(23, 59, 59, 999);

      return shiftDate >= start && shiftDate <= end && (s.status === 'Published' || s.isApproved);
    });
    
    return filtered
      .sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.startTime.localeCompare(b.startTime);
      });
  }, [shifts, user, weekStart, weekEnd]);

  useEffect(() => {
    fetchRoster();
  }, [currentWeekStart]);

  const totalWeeklyPayroll = useMemo(() => {
    return filteredShifts.reduce((acc, shift) => {
      const start = shift.approvedStartTime || shift.startTime;
      const end = shift.approvedEndTime || shift.endTime;
      const hours = calculateHours(start, end);
      return acc + (hours * (shift.hourlyRate || 25));
    }, 0);
  }, [filteredShifts]);

  const totalWeeklyHours = useMemo(() => {
    return filteredShifts.reduce((acc, shift) => {
      const start = shift.approvedStartTime || shift.startTime;
      const end = shift.approvedEndTime || shift.endTime;
      return acc + calculateHours(start, end);
    }, 0);
  }, [filteredShifts]);

  return (
    <div className="space-y-2">
      <PageHeader title="Roster" />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {/* Weekly Payroll Card */}
        <div className="glass-card p-3 shadow-sm flex items-center gap-2 border border-slate-200 dark:border-slate-800">
          <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg shrink-0">
            <DollarSign size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-[8px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-widest truncate">Payroll</p>
            <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-50 truncate">${totalWeeklyPayroll.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        {/* Total Hours Card */}
        <div className="glass-card p-3 shadow-sm flex items-center gap-2 border border-slate-200 dark:border-slate-800">
          <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg shrink-0">
            <Clock size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-[8px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-widest truncate">Hours</p>
            <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-50 truncate">{totalWeeklyHours.toFixed(1)}h</p>
          </div>
        </div>

        {/* Date Navigation Card */}
        <div className="glass-card p-2 shadow-sm flex items-center justify-between gap-1 border border-slate-200 dark:border-slate-800 col-span-2 md:col-span-1">
          <button onClick={() => changeWeek(-1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors shrink-0">
              <ChevronDown size={14} className="rotate-90 text-slate-500" />
          </button>
          <div className="text-center min-w-0">
              <p className="text-[7px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-widest mb-0.5">Week Starting</p>
              <p className="text-[9px] font-semibold text-slate-900 dark:text-slate-50 truncate">
                  {weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
          </div>
          <button onClick={() => changeWeek(1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors shrink-0">
              <ChevronDown size={14} className="-rotate-90 text-slate-500" />
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="w-full sm:w-auto">
          <div className="relative w-full sm:w-auto min-w-[160px]">
            <select 
              value={viewType}
              onChange={(e) => setViewType(e.target.value as RosterViewType)}
              className="w-full appearance-none bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 pl-4 pr-10 py-3 rounded-xl font-semibold text-sm outline-none focus:ring-2 focus:ring-indigo-600/20 transition-all cursor-pointer"
            >
              <option value="List">Current View</option>
              <option value="Calendar">Calendar View</option>
            </select>
            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {viewType === 'List' ? (
        <div className="glass-card border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="py-20 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              </div>
            ) : filteredShifts.length > 0 ? (
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Day</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Staff</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Start Time</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">End Time</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Pay</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredShifts.map(shift => {
                    const start = shift.approvedStartTime || shift.startTime;
                    const end = shift.approvedEndTime || shift.endTime;
                    const hours = calculateHours(start, end);
                    const pay = hours * (shift.hourlyRate || 25);
                    return (
                      <tr key={shift.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3 text-xs font-bold text-slate-900 dark:text-slate-100">{shift.day}</td>
                        <td className="px-4 py-3 text-xs font-bold text-slate-900 dark:text-slate-100">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-[10px] font-bold">
                              {shift.staffName[0]}
                            </div>
                            <div className="flex flex-col">
                              <span>{shift.staffName} <span className="text-slate-500 font-normal ml-1">({shift.date})</span></span>
                              {isShiftInProgress(shift) && (
                                <span className="ml-2 text-[8px] font-bold uppercase bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 px-1.5 py-0.5 rounded">In Progress</span>
                              )}
                              <span className="text-[10px] font-normal text-slate-500">{shift.role}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[10px] font-medium text-slate-600 dark:text-slate-400">{start}</td>
                        <td className="px-4 py-3 text-[10px] font-medium text-slate-600 dark:text-slate-400">{end}</td>
                        <td className="px-4 py-3">
                          <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400">${pay.toFixed(2)}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">{hours}h</div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="py-20 text-center">
                <p className="text-slate-400 italic text-sm">No shifts found for this week.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[700px]">
              {/* Calendar Header */}
              <div className="hidden lg:grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                {DAYS_OF_WEEK.map(day => (
                  <div key={day} className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-800 last:border-r-0">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{day.substring(0, 3)}</span>
                  </div>
                ))}
              </div>
              
              {/* Calendar Body */}
              <div className="grid grid-cols-4 lg:grid-cols-7 min-h-[300px]">
                {DAYS_OF_WEEK.map(day => {
                  const dayShifts = filteredShifts.filter(s => s.day === day);
                  return (
                    <div key={day} className="border-r border-b border-slate-200 dark:border-slate-800 last:border-r-0 p-1 space-y-1 bg-slate-50/30 dark:bg-slate-900/30">
                      <div className="lg:hidden text-center mb-1">
                        <span className="text-[8px] font-semibold uppercase text-slate-400">{day.substring(0, 3)}</span>
                      </div>
                      {dayShifts.map(shift => {
                        const start = shift.approvedStartTime || shift.startTime;
                        const end = shift.approvedEndTime || shift.endTime;
                        const hours = calculateHours(start, end);
                        return (
                          <motion.div
                            key={shift.id}
                            whileHover={{ scale: 1.02 }}
                            className={cn(
                              "p-1.5 rounded-lg border shadow-sm transition-all group relative overflow-hidden",
                              shift.isApproved 
                                ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800" 
                                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700",
                              isShiftInProgress(shift) && "ring-2 ring-emerald-500 ring-offset-1"
                            )}
                          >
                            <div className="flex items-center gap-1 mb-0.5">
                              <div className={cn(
                                "w-5 h-5 rounded-md flex items-center justify-center font-semibold text-[8px] shrink-0",
                                shift.isApproved 
                                  ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                                  : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                              )}>
                                {shift.staffName[0]}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[8px] font-semibold text-slate-900 dark:text-slate-100 truncate">{shift.staffName}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1 text-[7px] text-slate-500 dark:text-slate-400 font-semibold">
                              <Clock size={6} />
                              {start}-{end}
                            </div>

                            <div className="flex items-center justify-between mt-0.5 pt-0.5 border-t border-slate-100 dark:border-slate-700">
                              <span className="text-[8px] font-semibold text-indigo-600 dark:text-indigo-400">
                                ${(hours * (shift.hourlyRate || 25)).toFixed(0)}
                              </span>
                              <span className="text-[7px] font-semibold text-slate-400">
                                {hours}h
                              </span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
