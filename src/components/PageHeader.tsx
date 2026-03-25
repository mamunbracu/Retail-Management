import { useEffect, useState, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  children?: ReactNode;
  onBack?: () => void;
}

export const PageHeader = ({ title, children, onBack }: PageHeaderProps) => {
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalTarget(document.getElementById('page-header-portal'));
  }, []);

  const content = (
    <div className="flex items-center justify-between w-full gap-4">
      <div className="flex items-center gap-3">
        {onBack && (
          <button 
            onClick={onBack}
            className="p-2 bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-xl transition-colors text-slate-900 dark:text-white shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white truncate">{title}</h2>
      </div>
      {children && <div className="flex items-center gap-2 ml-auto">{children}</div>}
    </div>
  );

  if (portalTarget) {
    return createPortal(content, portalTarget);
  }

  // Fallback if portal target is not found (e.g., during initial render)
  return <div className="hidden">{content}</div>;
};
