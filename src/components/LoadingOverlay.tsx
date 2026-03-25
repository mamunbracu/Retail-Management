export const LoadingOverlay = () => (
  <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/90 dark:bg-slate-950/90 backdrop-blur-sm">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 rounded-full animate-spin"></div>
      <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-emerald-500 rounded-full animate-spin animation-delay-150"></div>
    </div>
    <p className="mt-6 text-lg font-bold text-slate-800 dark:text-white animate-pulse">Reloading Application...</p>
  </div>
);
