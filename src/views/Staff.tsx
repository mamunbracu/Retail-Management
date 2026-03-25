import { Search, UserPlus, Mail, Phone, MapPin, MoreVertical } from 'lucide-react';
import { motion } from 'motion/react';

const staffMembers = [
  { id: 1, name: 'John Doe', role: 'Manager', email: 'john@firestation.com', phone: '0412 345 678', status: 'Active', avatar: 'JD' },
  { id: 2, name: 'Jane Smith', role: 'Senior Staff', email: 'jane@firestation.com', phone: '0423 456 789', status: 'Active', avatar: 'JS' },
  { id: 3, name: 'Mike Wilson', role: 'Junior Staff', email: 'mike@firestation.com', phone: '0434 567 890', status: 'On Leave', avatar: 'MW' },
  { id: 4, name: 'Sarah Brown', role: 'Junior Staff', email: 'sarah@firestation.com', phone: '0445 678 901', status: 'Active', avatar: 'SB' },
];

export function Staff() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search staff members..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>
        <button className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors font-medium">
          <UserPlus size={18} />
          Add Staff Member
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {staffMembers.map((staff, index) => (
          <motion.div
            key={staff.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl font-bold">
                  {staff.avatar}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{staff.name}</h3>
                  <p className="text-sm font-medium text-emerald-600">{staff.role}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`w-2 h-2 rounded-full ${staff.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                    <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">{staff.status}</span>
                  </div>
                </div>
              </div>
              <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors">
                <MoreVertical size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-3 text-slate-600">
                <Mail size={16} className="text-slate-400" />
                <span className="text-sm">{staff.email}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <Phone size={16} className="text-slate-400" />
                <span className="text-sm">{staff.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600 sm:col-span-2">
                <MapPin size={16} className="text-slate-400" />
                <span className="text-sm">123 Main St, Sydney NSW 2000</span>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button className="flex-1 px-4 py-2 bg-slate-50 text-slate-700 rounded-xl hover:bg-slate-100 transition-colors text-sm font-medium">
                View Profile
              </button>
              <button className="flex-1 px-4 py-2 bg-slate-50 text-slate-700 rounded-xl hover:bg-slate-100 transition-colors text-sm font-medium">
                Edit Details
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
