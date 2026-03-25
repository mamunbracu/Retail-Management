import { User, Bell, Shield, Database, HelpCircle, LogOut } from 'lucide-react';

export function Settings() {
  const sections = [
    { icon: User, label: 'Profile Settings', desc: 'Manage your personal information and preferences' },
    { icon: Bell, label: 'Notifications', desc: 'Configure how you receive alerts and updates' },
    { icon: Shield, label: 'Security', desc: 'Update your password and security settings' },
    { icon: Database, label: 'Data Management', desc: 'Export or backup your system data' },
    { icon: HelpCircle, label: 'Support', desc: 'Get help or view documentation' },
  ];

  return (
    <div className="max-w-4xl space-y-8">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl font-bold text-slate-400">
              JD
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">John Doe</h3>
              <p className="text-slate-500">Administrator • Firestation Newsagency</p>
              <button className="mt-2 text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors">
                Change Photo
              </button>
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-50">
          {sections.map((section) => (
            <button
              key={section.label}
              className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-all group text-left"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-slate-100 text-slate-500 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                  <section.icon size={22} />
                </div>
                <div>
                  <p className="font-bold text-slate-900">{section.label}</p>
                  <p className="text-sm text-slate-500">{section.desc}</p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 group-hover:border-emerald-200 group-hover:text-emerald-500 transition-all">
                →
              </div>
            </button>
          ))}
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100">
          <button className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-bold text-sm">
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl">
        <h4 className="font-bold text-amber-900 mb-2">System Information</h4>
        <p className="text-sm text-amber-800 opacity-80">
          Version 2.4.0-stable. Last updated March 20, 2026.
          Your data is automatically backed up every 24 hours.
        </p>
      </div>
    </div>
  );
}
