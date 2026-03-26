import { useState, useEffect } from 'react';
import { Moon, Sun, Bell, Shield, Database, Trash2, CheckCircle2, XCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../utils';
import { api } from '../services/api';
import { PageHeader } from '../components/PageHeader';
import { Employee } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useSecurity } from '../contexts/SecurityContext';

interface SettingsViewProps {
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
  onBack?: () => void;
}

export const SettingsView = ({ isDarkMode, setIsDarkMode, onBack }: SettingsViewProps) => {
  const { user } = useAuth();
  const { requirePin } = useSecurity();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ previous: '', new: '', confirm: '' });

  useEffect(() => {
    if (user?.role === 'Admin') {
      api.getEmployees().then(setEmployees).catch(console.error);
    }
  }, [user]);

  const handleAdminResetPassword = async (email: string, newPassword: string) => {
    try {
      await api.resetPassword(email, undefined, newPassword);
      toast.success(`Password reset for ${email}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to reset password");
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.new !== passwordForm.confirm) {
      toast.error("New passwords don't match");
      return;
    }
    try {
      await api.resetPassword(user?.email || '', passwordForm.previous, passwordForm.new);
      toast.success("Password changed successfully");
      setIsChangingPassword(false);
      setPasswordForm({ previous: '', new: '', confirm: '' });
    } catch (error: any) {
      toast.error(error.message || "Failed to change password");
    }
  };

  const checkHealth = async () => {
    setIsChecking(true);
    try {
      const status = await api.healthCheck();
      setHealthStatus(status);
    } catch (error) {
      console.error('Health check failed:', error);
      setHealthStatus({ error: 'Failed to connect to server' });
    } finally {
      setIsChecking(false);
    }
  };

  const handleSeed = async () => {
    requirePin(async () => {
      setIsSeeding(true);
      try {
        await api.seedDatabase();
        await checkHealth();
        toast.success('Initial data seeded successfully!');
      } catch (error) {
        console.error('Seeding failed:', error);
        toast.error('Failed to seed data');
      } finally {
        setIsSeeding(false);
      }
    });
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const clearData = async () => {
    requirePin(async () => {
      try {
        await api.clearAllData();
        window.location.reload();
      } catch (error) {
        console.error('Failed to clear data:', error);
      }
    });
  };

  return (
    <div className="max-w-4xl space-y-2">
      <PageHeader title="Settings" onBack={onBack} />
      <div className="glass-card overflow-hidden shadow-sm">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
            <Shield className="text-indigo-600" />
            General Settings
          </h3>
        </div>
        <div className="p-8 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 glass rounded-2xl text-slate-600 dark:text-slate-400">
                {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
              </div>
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200">Appearance</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Switch between light and dark mode</p>
              </div>
            </div>
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={cn(
                "w-14 h-8 rounded-full transition-all relative",
                isDarkMode ? "bg-indigo-600" : "bg-slate-200"
              )}
            >
              <div className={cn(
                "absolute top-1 w-6 h-6 rounded-full bg-white shadow-sm transition-all",
                isDarkMode ? "left-7" : "left-1"
              )} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 glass rounded-2xl text-slate-600 dark:text-slate-400">
                <Bell size={24} />
              </div>
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200">Notifications</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Manage system alerts and reminders</p>
              </div>
            </div>
            <button className="px-4 py-2 glass rounded-xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-800 dark:text-slate-200">
              Configure
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 glass rounded-2xl text-slate-600 dark:text-slate-400">
                <Shield size={24} />
              </div>
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200">Change Password</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Update your account password</p>
              </div>
            </div>
            <button 
              onClick={() => setIsChangingPassword(!isChangingPassword)}
              className="px-4 py-2 glass rounded-xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-800 dark:text-slate-200"
            >
              {isChangingPassword ? 'Cancel' : 'Change'}
            </button>
          </div>

          {isChangingPassword && (
            <div 
              className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700"
            >
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600 dark:text-slate-400">Current Password</label>
                  <input 
                    type="password" 
                    required
                    value={passwordForm.previous}
                    onChange={e => setPasswordForm(prev => ({ ...prev, previous: e.target.value }))}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600 dark:text-slate-400">New Password</label>
                  <input 
                    type="password" 
                    required
                    value={passwordForm.new}
                    onChange={e => setPasswordForm(prev => ({ ...prev, new: e.target.value }))}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600 dark:text-slate-400">Confirm New Password</label>
                  <input 
                    type="password" 
                    required
                    value={passwordForm.confirm}
                    onChange={e => setPasswordForm(prev => ({ ...prev, confirm: e.target.value }))}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold transition-colors">
                  Update Password
                </button>
              </form>
            </div>
          )}

          {user?.role === 'Admin' && (
            <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Staff Password Reset</h4>
              <div className="space-y-4">
                {employees.map(emp => (
                  <div key={emp.id} className="flex items-center justify-between p-4 glass rounded-2xl">
                    <span className="font-bold text-slate-700 dark:text-slate-200">{emp.name}</span>
                    <button 
                      onClick={() => {
                        const newPassword = prompt(`Enter new password for ${emp.name}`);
                        if (newPassword) handleAdminResetPassword(emp.email, newPassword);
                      }}
                      className="px-4 py-2 bg-amber-600 text-white rounded-xl font-bold text-sm hover:bg-amber-700 transition-colors"
                    >
                      Reset Password
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="glass-card overflow-hidden shadow-sm">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
            <Database className="text-amber-500" />
            Database Status
          </h3>
          <button 
            onClick={checkHealth}
            disabled={isChecking}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50"
          >
            <RefreshCw size={20} className={cn(isChecking && "animate-spin")} />
          </button>
        </div>
        <div className="p-8">
          {healthStatus ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {healthStatus.tables ? Object.entries(healthStatus.tables).map(([table, status]: [string, any]) => {
                  if (table.endsWith('_schema')) return null;
                  return (
                    <div key={table} className="flex items-center justify-between p-4 glass rounded-2xl">
                      <span className="font-bold text-sm capitalize text-slate-700 dark:text-slate-200">{table.replace('_', ' ')}</span>
                      {status.startsWith('OK') ? (
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-1 text-emerald-500">
                            <CheckCircle2 size={16} />
                            <span className="text-xs font-bold">OK</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-medium">{status.split('(')[1]?.replace(')', '')}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-rose-500" title={status}>
                          <XCircle size={16} />
                          <span className="text-xs font-bold">Error</span>
                        </div>
                      )}
                    </div>
                  );
                }) : (
                  <div className="col-span-full p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center gap-2">
                    <XCircle size={20} />
                    <p className="font-bold">{healthStatus.error || 'Database connection error'}</p>
                  </div>
                )}
              </div>

              {/* Schema Mismatch Alert - Keep this as a warning if detected */}
              {Object.keys(healthStatus.tables || {}).some(k => k.endsWith('_schema') && healthStatus.tables[k] !== 'Valid') && (
                <div className="p-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                    <AlertTriangle size={20} />
                    <h4 className="font-bold uppercase tracking-wider text-sm">Schema Mismatch Detected</h4>
                  </div>
                  <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                    Your Supabase database is missing required columns. CRUD operations will fail until you update your schema.
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Scroll down to the <b>Troubleshooting & Schema Fixes</b> section to copy the fix SQL.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center p-12">
              <RefreshCw className="animate-spin text-slate-400" size={32} />
            </div>
          )}
        </div>
      </div>

      {/* Troubleshooting & Schema Fixes Section */}
      <div className="glass-card overflow-hidden shadow-sm">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
            <AlertTriangle className="text-amber-500" />
            Troubleshooting & Schema Fixes
          </h3>
        </div>
        <div className="p-8 space-y-6">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 space-y-4">
            <p className="text-sm text-slate-700 dark:text-slate-300">
              If you see "column does not exist" or "schema cache" errors, your Supabase database needs to be updated with the latest schema.
            </p>
            
            <div className="space-y-4">
              <button 
                onClick={() => {
                  const sql = `ALTER TABLE employees ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS staff_id TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE roster ADD COLUMN IF NOT EXISTS employee_id TEXT;
ALTER TABLE roster ADD COLUMN IF NOT EXISTS staff_name TEXT;
ALTER TABLE roster ADD COLUMN IF NOT EXISTS day TEXT;
ALTER TABLE roster ADD COLUMN IF NOT EXISTS date TEXT;
ALTER TABLE roster ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE roster ADD COLUMN IF NOT EXISTS start_time TEXT;
ALTER TABLE roster ADD COLUMN IF NOT EXISTS end_time TEXT;
ALTER TABLE roster ADD COLUMN IF NOT EXISTS repeat_next_week BOOLEAN DEFAULT FALSE;
ALTER TABLE roster ADD COLUMN IF NOT EXISTS is_paid INTEGER DEFAULT 0;
ALTER TABLE roster ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE roster ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE roster ADD COLUMN IF NOT EXISTS tasks JSONB DEFAULT '[]'::jsonb;
ALTER TABLE roster ADD COLUMN IF NOT EXISTS is_approved INTEGER DEFAULT 0;
ALTER TABLE roster ADD COLUMN IF NOT EXISTS approved_start_time TEXT;
ALTER TABLE roster ADD COLUMN IF NOT EXISTS approved_end_time TEXT;
ALTER TABLE roster ADD COLUMN IF NOT EXISTS approved_by TEXT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS total_sales DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS added_by TEXT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS shift TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS amount DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS added_by TEXT;
ALTER TABLE order_list ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE order_list ADD COLUMN IF NOT EXISTS order_day TEXT;
ALTER TABLE order_list ADD COLUMN IF NOT EXISTS ordered_by TEXT;
ALTER TABLE order_list ADD COLUMN IF NOT EXISTS ordered_time TEXT;
ALTER TABLE order_list ADD COLUMN IF NOT EXISTS delivery_day TEXT;
ALTER TABLE order_list ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE order_list ADD COLUMN IF NOT EXISTS fields JSONB;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS fields JSONB;

CREATE TABLE IF NOT EXISTS app_settings (
  id TEXT PRIMARY KEY,
  site_title TEXT,
  site_icon TEXT,
  sidebar_items JSONB,
  dashboard_cards JSONB,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  compare_at_price DECIMAL(10, 2),
  stock_quantity INTEGER DEFAULT 0,
  image_url TEXT,
  images TEXT[],
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE IF NOT EXISTS site_assets (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT,
  subtitle TEXT,
  content TEXT,
  image_url TEXT,
  link_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES employees(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending',
  total_amount DECIMAL(10, 2) NOT NULL,
  shipping_address TEXT,
  billing_address TEXT,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending',
  tracking_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  price_at_purchase DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE IF NOT EXISTS wishlists (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES employees(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(user_id, product_id)
);

CREATE TABLE IF NOT EXISTS cart_items (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES employees(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(user_id, product_id, color)
);

CREATE TABLE IF NOT EXISTS user_themes (
  user_id TEXT PRIMARY KEY REFERENCES employees(id) ON DELETE CASCADE,
  theme TEXT NOT NULL DEFAULT 'classic',
  is_dark BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE IF NOT EXISTS ecommerce_settings (
  id TEXT PRIMARY KEY,
  store_name TEXT NOT NULL,
  currency TEXT DEFAULT 'USD',
  shipping_fee DECIMAL(10, 2) DEFAULT 0,
  tax_rate DECIMAL(5, 2) DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Fix for item_name not-null constraint if it exists
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_list' AND column_name='item_name') THEN
    ALTER TABLE order_list ALTER COLUMN item_name DROP NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales' AND column_name='item_name') THEN
    ALTER TABLE sales ALTER COLUMN item_name DROP NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales' AND column_name='amount') THEN
    ALTER TABLE sales ALTER COLUMN amount DROP NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='item_name') THEN
    ALTER TABLE transactions ALTER COLUMN item_name DROP NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_list' AND column_name='quantity') THEN
    ALTER TABLE order_list ALTER COLUMN quantity DROP NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_list' AND column_name='price') THEN
    ALTER TABLE order_list ALTER COLUMN price DROP NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_list' AND column_name='status') THEN
    ALTER TABLE order_list ALTER COLUMN status DROP NOT NULL;
  END IF;
END $$;`;
                  try {
                    navigator.clipboard.writeText(sql);
                    toast.success('Fix SQL copied to clipboard!');
                  } catch (err) {
                    const textArea = document.createElement("textarea");
                    textArea.value = sql;
                    document.body.appendChild(textArea);
                    textArea.focus();
                    textArea.select();
                    try {
                      document.execCommand('copy');
                      toast.success('Fix SQL copied to clipboard!');
                    } catch (err) {
                      console.error('Fallback: Oops, unable to copy', err);
                      toast.error('Failed to copy to clipboard');
                    }
                    document.body.removeChild(textArea);
                  }
                }}
                className="w-full py-4 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl font-semibold uppercase tracking-widest transition-all shadow-lg shadow-amber-600/20 active:scale-[0.98]"
              >
                Copy Fix SQL to Clipboard
              </button>

              <div className="pt-4 border-t border-amber-200 dark:border-amber-800">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 italic">
                  DANGER: Only use this if the Fix SQL above doesn't work. This will delete all your existing orders.
                </p>
                <button 
                  onClick={() => {
                    const sql = `-- NUCLEAR RESET (DANGER: DELETES ALL ORDERS)
DROP TABLE IF EXISTS order_list;
CREATE TABLE order_list (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  order_day TEXT,
  ordered_by TEXT,
  ordered_time TEXT,
  delivery_day TEXT,
  status TEXT,
  fields JSONB NOT NULL
);
DROP TABLE IF EXISTS roster;
CREATE TABLE roster (
  id TEXT PRIMARY KEY,
  employee_id TEXT,
  staff_name TEXT NOT NULL,
  day TEXT NOT NULL,
  date TEXT,
  status TEXT,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  hourly_rate DECIMAL(10, 2) DEFAULT 0,
  repeat_next_week BOOLEAN DEFAULT FALSE,
  is_paid INTEGER DEFAULT 0,
  paid_amount DECIMAL(10, 2) DEFAULT 0,
  tasks JSONB DEFAULT '[]'::jsonb,
  is_approved INTEGER DEFAULT 0,
  approved_start_time TEXT,
  approved_end_time TEXT,
  approved_by TEXT
);`;
                    try {
                      navigator.clipboard.writeText(sql);
                      toast.success('Nuclear Reset SQL copied!');
                    } catch (err) {
                      const textArea = document.createElement("textarea");
                      textArea.value = sql;
                      document.body.appendChild(textArea);
                      textArea.focus();
                      textArea.select();
                      try {
                        document.execCommand('copy');
                        toast.success('Nuclear Reset SQL copied!');
                      } catch (err) {
                        console.error('Fallback: Oops, unable to copy', err);
                        toast.error('Failed to copy to clipboard');
                      }
                      document.body.removeChild(textArea);
                    }
                  }}
                  className="w-full py-2 bg-rose-600/10 hover:bg-rose-600/20 text-rose-600 rounded-xl text-xs font-bold transition-colors border border-rose-600/20"
                >
                  Copy Nuclear Reset SQL (Deletes All Orders)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden shadow-sm">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
            <Database className="text-amber-500" />
            Data Management
          </h3>
        </div>
        <div className="p-8 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl text-indigo-500 dark:text-indigo-400">
                <Database size={24} />
              </div>
              <div>
                <p className="font-bold text-indigo-500 dark:text-indigo-400">Seed Initial Data</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Populate database with default employees and instructions</p>
              </div>
            </div>
            <button 
              onClick={handleSeed}
              disabled={isSeeding}
              className="px-6 py-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 dark:text-indigo-400 rounded-xl font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors disabled:opacity-50"
            >
              {isSeeding ? 'Seeding...' : 'Seed Data'}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl text-indigo-500 dark:text-indigo-400">
                <Trash2 size={24} />
              </div>
              <div>
                <p className="font-bold text-indigo-500 dark:text-indigo-400">Reset Application</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Clear all employees, sales, and instructions</p>
              </div>
            </div>
            <button 
              onClick={clearData}
              className="px-6 py-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 dark:text-indigo-400 rounded-xl font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
            >
              Clear All Data
            </button>
          </div>
        </div>
      </div>

      <div className="p-8 glass rounded-3xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
            F
          </div>
          <div>
            <p className="font-bold text-slate-800 dark:text-slate-200">Firestation Newsagency v1.0.0</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">© 2026 Firestation Management Systems</p>
          </div>
        </div>
      </div>
    </div>
  );
};
