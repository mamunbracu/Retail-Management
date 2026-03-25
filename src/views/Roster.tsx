import { ChevronLeft, ChevronRight, Plus, Download, Filter } from 'lucide-react';
import { motion } from 'motion/react';

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const dates = [23, 24, 25, 26, 27, 28, 29];

const shifts = [
  { id: 1, staff: 'John Doe', start: '09:00', end: '17:00', day: 'Mon', color: 'bg-blue-500' },
  { id: 2, staff: 'Jane Smith', start: '10:00', end: '18:00', day: 'Mon', color: 'bg-emerald-500' },
  { id: 3, staff: 'Sarah Brown', start: '08:00', end: '16:00', day: 'Tue', color: 'bg-violet-500' },
  { id: 4, staff: 'Mike Wilson', start: '12:00', end: '20:00', day: 'Wed', color: 'bg-amber-500' },
  { id: 5, staff: 'John Doe', start: '09:00', end: '17:00', day: 'Thu', color: 'bg-blue-500' },
];

export function Roster() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600">
              <ChevronLeft size={20} />
            </button>
            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600">
              <ChevronRight size={20} />
            </button>
          </div>
          <h3 className="text-lg font-bold text-slate-900">March 23 - March 29, 2026</h3>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-700 rounded-xl hover:bg-slate-100 transition-colors text-sm font-medium border border-slate-200">
            <Filter size={16} />
            Filter
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-700 rounded-xl hover:bg-slate-100 transition-colors text-sm font-medium border border-slate-200">
            <Download size={16} />
            Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors text-sm font-medium shadow-sm shadow-emerald-200">
            <Plus size={16} />
            Add Shift
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-7 border-b border-slate-100">
          {days.map((day, i) => (
            <div key={day} className="p-4 text-center border-r border-slate-100 last:border-r-0 bg-slate-50/50">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{day}</p>
              <p className="text-xl font-bold text-slate-900 mt-1">{dates[i]}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 min-h-[600px] divide-x divide-slate-100">
          {days.map((day) => (
            <div key={day} className="p-2 space-y-2 bg-white relative group">
              {shifts
                .filter((s) => s.day === day)
                .map((shift) => (
                  <motion.div
                    key={shift.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-xl ${shift.color} text-white shadow-sm cursor-pointer hover:brightness-110 transition-all`}
                  >
                    <p className="text-xs font-bold opacity-90">{shift.start} - {shift.end}</p>
                    <p className="text-sm font-bold mt-1 truncate">{shift.staff}</p>
                  </motion.div>
                ))}
              <button className="absolute inset-x-2 bottom-2 py-2 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:border-emerald-300 hover:text-emerald-500 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 text-xs font-bold">
                <Plus size={14} />
                Add
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
