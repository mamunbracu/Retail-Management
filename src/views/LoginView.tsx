import { useState, FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { Shield, Lock, ArrowRight, X, User, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const LoginView = () => {
  const { login } = useAuth();
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const [dbError, setDbError] = useState<string | null>(null);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setDbError(null);
    setStatus('idle');
    
    try {
      const user = await api.login(adminId.trim(), password);
      if (user) {
        setStatus('success');
        toast.success('Logged in successfully');
        // Small delay to show success state
        setTimeout(() => login(user), 800);
      } else {
        setStatus('error');
        toast.error('Invalid ID or password');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setStatus('error');
      let message = error.message || 'Login failed. Please try again.';
      
      if (message.includes('<!DOCTYPE html>') || message.includes('<html')) {
        message = 'Server returned an invalid response. Please check your connection or try again later.';
      }
      
      toast.error(message);
      if (message.includes('Database tables not found') || message.includes('Could not find the table')) {
        setDbError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F5DC] dark:bg-[#0B0F19] p-4 overflow-hidden relative">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse delay-700" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-[440px] z-10"
      >
        <div className="text-center mb-8">
          <motion.div 
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: 0.2
            }}
            className="w-20 h-20 bg-primary rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-primary/30"
          >
            <Shield className="text-white" size={40} />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight"
          >
            Welcome Back
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-slate-500 font-medium"
          >
            Sign in to your retailer dashboard
          </motion.p>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-8 rounded-[2.5rem] relative overflow-hidden"
        >
          {/* Status Overlay */}
          <AnimatePresence>
            {status !== 'idle' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`absolute inset-0 z-20 flex flex-col items-center justify-center backdrop-blur-md ${
                  status === 'success' ? 'bg-emerald-500/10' : 'bg-rose-500/10'
                }`}
              >
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", damping: 12 }}
                >
                  {status === 'success' ? (
                    <CheckCircle2 className="text-emerald-500 mb-2" size={64} />
                  ) : (
                    <XCircle className="text-rose-500 mb-2" size={64} />
                  )}
                </motion.div>
                <p className={`font-bold ${status === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {status === 'success' ? 'Access Granted' : 'Access Denied'}
                </p>
                {status === 'error' && (
                  <button 
                    onClick={() => setStatus('idle')}
                    className="mt-4 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    Try Again
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {dbError && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl space-y-3 overflow-hidden"
            >
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <AlertTriangle size={20} />
                <h4 className="font-bold text-sm">Database Setup Required</h4>
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-200 font-medium leading-relaxed">
                Your database is missing tables. Please run the SQL schema in your Supabase SQL Editor.
              </p>
              <button 
                onClick={() => window.open('https://supabase.com/dashboard/project/_/sql', '_blank')}
                className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Open SQL Editor
              </button>
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2 group">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Staff ID</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                <input
                  type="text"
                  value={adminId}
                  onChange={(e) => setAdminId(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 focus:bg-white dark:focus:bg-slate-950 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-slate-900 dark:text-white placeholder:text-slate-300"
                  placeholder="Enter your ID"
                  required
                />
              </div>
            </div>

            <div className="space-y-2 group">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Password</label>
                <button 
                  type="button" 
                  onClick={() => setShowForgotModal(true)} 
                  className="text-[10px] font-bold text-primary hover:underline underline-offset-4 transition-all uppercase tracking-wider"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 focus:bg-white dark:focus:bg-slate-950 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-slate-900 dark:text-white placeholder:text-slate-300"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl font-bold bg-primary hover:bg-primary-hover text-white transition-all flex items-center justify-center gap-2 shadow-xl shadow-primary/20 disabled:opacity-70 disabled:cursor-not-allowed mt-4 relative overflow-hidden group"
            >
              <span className="relative z-10 flex items-center gap-2">
                {loading ? 'Verifying...' : 'Sign In'}
                {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
              </span>
              <motion.div 
                className="absolute inset-0 bg-white/10"
                initial={{ x: '-100%' }}
                whileHover={{ x: '100%' }}
                transition={{ duration: 0.5 }}
              />
            </motion.button>
          </form>
        </motion.div>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center mt-8 text-xs text-slate-400 font-medium"
        >
          Secure access for authorized personnel only.
        </motion.p>
      </motion.div>

      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForgotModal(false)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl relative z-10 border border-slate-100 dark:border-slate-800"
            >
              <button 
                onClick={() => setShowForgotModal(false)}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-800 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
              <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center mb-6">
                <Lock className="text-rose-500" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Forgot Password?</h3>
              <p className="text-slate-500 font-medium mb-8 leading-relaxed text-sm">
                For security reasons, please contact your administrator to have your password reset. They can update your credentials from the Employees management dashboard.
              </p>
              <button 
                onClick={() => setShowForgotModal(false)}
                className="w-full py-4 rounded-2xl font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-opacity"
              >
                Back to Login
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
