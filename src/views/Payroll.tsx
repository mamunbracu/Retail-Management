import { FileText, Download, TrendingUp, AlertCircle } from 'lucide-react';

const payrollData = [
  { id: 1, name: 'John Doe', hours: 40, rate: 35, gross: 1400, tax: 280, net: 1120 },
  { id: 2, name: 'Jane Smith', hours: 38, rate: 32, gross: 1216, tax: 243, net: 973 },
  { id: 3, name: 'Sarah Brown', hours: 25, rate: 28, gross: 700, tax: 140, net: 560 },
  { id: 4, name: 'Mike Wilson', hours: 30, rate: 28, gross: 840, tax: 168, net: 672 },
];

export function Payroll() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-slate-900">Current Pay Period</h3>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-700 rounded-xl hover:bg-slate-100 transition-colors text-sm font-medium border border-slate-200">
                <Download size={16} />
                Export CSV
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors text-sm font-medium shadow-sm shadow-emerald-200">
                <FileText size={16} />
                Generate Payslips
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Staff Member</th>
                  <th className="text-right py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Hours</th>
                  <th className="text-right py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Rate</th>
                  <th className="text-right py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Gross</th>
                  <th className="text-right py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Net Pay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {payrollData.map((item) => (
                  <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="py-4">
                      <p className="font-bold text-slate-900">{item.name}</p>
                    </td>
                    <td className="py-4 text-right font-medium text-slate-600">{item.hours}h</td>
                    <td className="py-4 text-right font-medium text-slate-600">${item.rate}/h</td>
                    <td className="py-4 text-right font-medium text-slate-900">${item.gross}</td>
                    <td className="py-4 text-right">
                      <span className="font-bold text-emerald-600">${item.net}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-emerald-600 p-6 rounded-2xl text-white shadow-lg shadow-emerald-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-white/20 rounded-lg">
                <TrendingUp size={20} />
              </div>
              <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded-full uppercase tracking-wider">Total Period</span>
            </div>
            <p className="text-emerald-100 text-sm font-medium">Total Payroll Cost</p>
            <h3 className="text-3xl font-bold mt-1">$4,156.00</h3>
            <div className="mt-4 pt-4 border-t border-white/10 flex justify-between text-sm">
              <span className="opacity-80">Previous Period</span>
              <span className="font-bold">$3,980.00</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <AlertCircle size={18} className="text-amber-500" />
              Pending Actions
            </h4>
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                <p className="text-sm font-medium text-amber-800">2 Timesheets pending approval</p>
                <button className="text-xs font-bold text-amber-600 mt-2 hover:underline uppercase tracking-wider">Review Now</button>
              </div>
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                <p className="text-sm font-medium text-blue-800">Tax reports ready for Q1</p>
                <button className="text-xs font-bold text-blue-600 mt-2 hover:underline uppercase tracking-wider">Download PDF</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
