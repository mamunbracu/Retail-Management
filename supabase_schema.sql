-- Supabase Schema for Firestation Newsagency (Updated for Postgres compatibility)

-- Drop existing tables to ensure clean state with correct types
DROP TABLE IF EXISTS app_settings;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS order_list;
DROP TABLE IF EXISTS roster;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS sales;
DROP TABLE IF EXISTS shift_tasks;
DROP TABLE IF EXISTS resources;
DROP TABLE IF EXISTS instructions;
DROP TABLE IF EXISTS employees;

-- Employees Table
CREATE TABLE employees (
  id TEXT PRIMARY KEY,
  staff_id TEXT,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  bio TEXT,
  joined_date TEXT,
  password TEXT,
  hourly_rate DECIMAL(10, 2)
);

-- Instructions Table
CREATE TABLE instructions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  highlight TEXT DEFAULT 'normal'
);

-- Resources Table
CREATE TABLE resources (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  fields JSONB NOT NULL
);

-- Shift Tasks Table (Global templates)
CREATE TABLE shift_tasks (
  id TEXT PRIMARY KEY,
  tasks JSONB NOT NULL
);

-- Sales Table
CREATE TABLE sales (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  shift TEXT NOT NULL,
  total_sales DECIMAL(10, 2) NOT NULL,
  added_by TEXT
);

-- Transactions Table
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  type TEXT NOT NULL, -- 'income' or 'expense'
  category TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  added_by TEXT
);

-- Roster Table
CREATE TABLE roster (
  id TEXT PRIMARY KEY,
  employee_id TEXT REFERENCES employees(id),
  staff_name TEXT NOT NULL,
  day TEXT NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Draft',
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  hourly_rate DECIMAL(10, 2) NOT NULL,
  repeat_next_week BOOLEAN DEFAULT true,
  is_paid INTEGER DEFAULT 0,
  paid_amount DECIMAL(10, 2) DEFAULT 0,
  tasks JSONB DEFAULT '[]'::jsonb,
  is_approved INTEGER DEFAULT 0,
  approved_start_time TEXT,
  approved_end_time TEXT,
  approved_by TEXT
);

-- Order List Table
CREATE TABLE order_list (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  order_day TEXT,
  ordered_by TEXT,
  ordered_time TEXT,
  delivery_day TEXT,
  fields JSONB NOT NULL
);

-- Notifications Table
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  created_at TEXT NOT NULL,
  is_read INTEGER DEFAULT 0
);

-- Salaries Table
CREATE TABLE salaries (
  id TEXT PRIMARY KEY,
  employee_id TEXT REFERENCES employees(id),
  staff_name TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  type TEXT NOT NULL, -- 'Paid', 'Due', 'Bonus'
  date TEXT NOT NULL,
  notes TEXT,
  shift_ids JSONB DEFAULT '[]'::jsonb
);

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  received_date TEXT NOT NULL,
  uploaded_by TEXT NOT NULL,
  uploaded_at TEXT NOT NULL,
  url TEXT NOT NULL
);

-- App Settings Table
CREATE TABLE app_settings (
  id TEXT PRIMARY KEY,
  site_title TEXT NOT NULL DEFAULT 'Firestation Newsagency',
  site_icon TEXT NOT NULL DEFAULT 'Flame',
  sidebar_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  dashboard_cards JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on all tables
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructions ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE roster ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE salaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all access for now (Development)
-- In production, these should be more restrictive
CREATE POLICY "Allow all access to employees" ON employees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to instructions" ON instructions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to resources" ON resources FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to shift_tasks" ON shift_tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to sales" ON sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to transactions" ON transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to roster" ON roster FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to order_list" ON order_list FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to salaries" ON salaries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to documents" ON documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to app_settings" ON app_settings FOR ALL USING (true) WITH CHECK (true);
