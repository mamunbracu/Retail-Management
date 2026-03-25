import { Users, Calendar, Clock, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';

export function Dashboard() {
  const stats = [
    { label: 'Total Staff', value: '12', icon: Users, color: 'bg-blue-500' },
    { label: 'Today\'s Shifts', value: '4', icon: Calendar, color: 'bg-emerald-500' },
    { label: 'Hours This Week', value: '168h', icon: Clock, color: 'bg-amber-500' },
    { label: 'Payroll Estimate', value: '$4,250', icon: TrendingUp, color: 'bg-violet-500' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.color} text-white`}>
                <stat.icon size={24} />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Upcoming Shifts</h3>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-medium">
                    {String.fromCharCode(64 + i)}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Staff Member {i}</p>
                    <p className="text-sm text-slate-500">09:00 AM - 05:00 PM</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                  Confirmed
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Recent Activity</h3>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2"></div>
                <div>
                  <p className="text-sm text-slate-900">
                    <span className="font-medium">John Doe</span> updated the roster for next week.
                  </p>
                  <p className="text-xs text-slate-500 mt-1">2 hours ago</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
