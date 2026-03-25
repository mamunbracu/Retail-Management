import * as LucideIcons from 'lucide-react';

interface HighlightCardData {
  headline: string;
  subValue: string;
  details?: string[];
}

interface HighlightCardProps {
  title: string;
  data: HighlightCardData;
  icon?: string;
}

export const HighlightCard = ({ title, data, icon }: HighlightCardProps) => {
  const Icon = (icon ? (LucideIcons as any)[icon] : null) || LucideIcons.Star;

  return (
    <div className="p-6 rounded-3xl border border-white/20 bg-white/10 backdrop-blur-md shadow-lg hover:shadow-xl transition-all">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-white/20 text-slate-800 dark:text-white">
          <Icon size={20} />
        </div>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{title}</p>
      </div>
      <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-1 truncate">
        {data.headline}
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{data.subValue}</p>
      {data.details && data.details.length > 0 && (
        <ul className="text-xs text-slate-500 dark:text-slate-500 space-y-1 border-t border-slate-200/20 pt-4">
          {data.details.map((detail, index) => (
            <li key={index}>{detail}</li>
          ))}
        </ul>
      )}
    </div>
  );
};
