export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export type HighlightType = 'normal' | 'warning' | 'danger' | 'success' | null;

export interface InstructionCard {
  id: string;
  title: string;
  content: string;
  highlight?: HighlightType;
}

export interface Shift {
  id: string;
  employeeId?: string;
  staffName: string;
  day: DayOfWeek;
  date: string; // ISO format YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  approvedStartTime?: string; // HH:mm
  approvedEndTime?: string;   // HH:mm
  isApproved?: boolean;
  approvedBy?: string;
  hourlyRate: number;
  role?: string;
  repeatNextWeek: boolean;
  isPaid?: number;
  paidAmount?: number;
  tasks?: string[];
  status: 'Draft' | 'Published' | 'Completed' | 'Paid';
}

export interface StaffProfile {
  name: string;
  role: string;
  email: string;
  phone: string;
  bio: string;
}

export type ViewType = string;

export interface SidebarItem {
  id: string;
  label: string;
  view: ViewType;
  icon: string; // Lucide icon name
  order: number;
  isVisible: boolean;
}

export interface CustomPageElement {
  id: string;
  type: 'card' | 'table' | 'heading' | 'title' | 'analytics';
  title?: string;
  isDynamicTitle?: boolean;
  content: string; // For static text or dynamic template
  isDynamicContent?: boolean;
  icon?: string; // Lucide icon name
  style: {
    color?: string; // Tailwind text class
    bgColor?: string; // Tailwind bg class
    fontFamily?: string; // Custom font family
    gridSpan?: number; // 1, 2, 3 etc for layout
  };
  dataSource?: string; // For tables/cards/analytics
  tableConfig?: {
    visibleColumns: string[]; // List of field names to show
  };
  analyticsConfig?: {
    chartType: 'bar' | 'pie' | 'line' | 'area' | 'list';
    dataKey: string; // The key to use for values
    nameKey: string; // The key to use for labels
  };
  footer?: string; // For card footer/description
  isDynamicFooter?: boolean;
  emoji?: string; // For card emoji
  order: number;
  isVisible: boolean;
}

export interface DashboardCard {
  id: string;
  title: string;
  icon: string;
  content: string;
  type: 'static' | 'dynamic';
  color: string;
  order: number;
  isVisible: boolean;
}

export interface AppSettings {
  id: string;
  siteTitle: string;
  siteIcon: string; // Lucide icon name
  sidebarItems: SidebarItem[];
  dashboardCards: DashboardCard[];
  customPages?: Record<string, CustomPageElement[]>;
  updatedAt: string;
}

export interface AppDocument {
  id: string;
  name: string;
  type: 'Invoice' | 'Personal';
  fileType: string;
  fileSize?: number;
  receivedDate: string;
  uploadedBy: string;
  uploadedAt: string;
  url: string;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  addedBy?: string;
}

export interface OrderField {
  label: string;
  value: string;
}

export interface OrderRecord {
  id: string;
  category: string; // e.g., 'Tobacco', 'Drinks', 'Stationery'
  itemName?: string; // For compatibility with legacy schemas
  quantity?: number; // For compatibility with legacy schemas
  status?: string; // For compatibility with legacy schemas
  orderDay: string;
  orderedBy: string;
  orderedTime: string;
  deliveryDay: string;
  fields: OrderField[];
}

export interface Employee {
  id: string;
  staffId: number;
  name: string;
  role: string;
  email: string;
  phone: string;
  bio: string;
  joinedDate: string;
  hourlyRate?: number;
  password?: string;
}

export interface Salary {
  id: string;
  employee_id: string;
  amount: number;
  type: 'Paid' | 'Due' | 'Bonus';
  date: string;
  notes?: string;
  staff_name?: string;
  shift_ids?: string[]; // Added to link salary to specific shifts
}

export type ShiftPeriod = 'Morning' | 'Evening' | 'Whole Day';

export interface Sale {
  id: string;
  date: string;
  shift: ShiftPeriod;
  totalSales: number;
  addedBy: string;
}

export interface ResourceField {
  label: string;
  value: string;
}

export interface Resource {
  id: string;
  category: string;
  title: string;
  fields: ResourceField[];
}

export interface AppNotification {
  id: string;
  message: string;
  type: string;
  timestamp: string;
  isRead: number;
}
