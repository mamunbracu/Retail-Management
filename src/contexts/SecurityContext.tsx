import { createContext, useContext, useState, ReactNode } from 'react';
import { ShieldCheck } from 'lucide-react';

interface SecurityContextType {
  requirePin: (action: () => void) => void;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (!context) throw new Error('useSecurity must be used within SecurityProvider');
  return context;
};

export const SecurityProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const requirePin = (action: () => void) => {
    setPendingAction(() => action);
    setIsOpen(true);
  };

  const handleConfirm = () => {
    if (pendingAction) pendingAction();
    setIsOpen(false);
    setPendingAction(null);
  };

  return (
    <SecurityContext.Provider value={{ requirePin }}>
      {children}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[110] p-4">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-2xl max-w-sm w-full animate-in fade-in zoom-in duration-200 border border-slate-200 dark:border-slate-800">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <ShieldCheck className="text-amber-600" size={32} />
            </div>
            <h3 className="text-2xl font-semibold mb-2 text-slate-900 dark:text-white text-center">Confirm Action</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 text-center font-medium">Are you sure you want to proceed with this action?</p>
            
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setIsOpen(false)} 
                className="px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all font-bold text-sm"
              >
                No, Cancel
              </button>
              <button 
                onClick={handleConfirm} 
                className="px-6 py-4 bg-primary text-white rounded-2xl hover:bg-primary-hover transition-all font-bold text-sm shadow-lg shadow-primary/20"
              >
                Yes, Proceed
              </button>
            </div>
          </div>
        </div>
      )}
    </SecurityContext.Provider>
  );
};
