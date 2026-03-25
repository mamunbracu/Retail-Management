import { LayoutDashboard } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';

export const PlaceholderView = ({ title }: { title: string }) => {
  return (
    <div className="space-y-6">
      <PageHeader title={title} />
      <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400 space-y-4">
        <div className="p-6 bg-slate-100 dark:bg-slate-800 rounded-full">
          <LayoutDashboard size={48} />
        </div>
        <div className="text-center">
          <h3 className="text-xl font-bold text-slate-600 dark:text-slate-300">{title} View</h3>
          <p>This section is currently under development.</p>
        </div>
      </div>
    </div>
  );
};
