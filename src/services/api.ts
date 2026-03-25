import { Employee, Sale, InstructionCard, Shift, Resource, OrderRecord, AppNotification, Transaction, Salary, AppDocument, AppSettings } from '../types';
// API Service with caching and rate-limiting - v1.0.2

const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5000; // 5 seconds

async function fetchJson<T>(url: string, options?: RequestInit, retries = 2): Promise<T> {
  const isGet = !options || options.method === 'GET' || options.method === undefined;
  
  if (isGet && cache.has(url)) {
    const cached = cache.get(url)!;
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data as T;
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    const text = await res.text();
    
    if (!res.ok) {
      if (res.status === 429 || text.includes('Rate exceeded')) {
        if (retries > 0) {
          const delay = (3 - retries) * 1000;
          console.warn(`[API] Rate limit hit for ${url}. Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return fetchJson(url, options, retries - 1);
        }
      }
      
      let errorMessage = text;
      try {
        const errorJson = JSON.parse(text);
        errorMessage = errorJson.error || errorJson.message || text;
      } catch (e) { }
      throw new Error(errorMessage);
    }
    
    try {
      const data = JSON.parse(text);
      if (isGet) {
        cache.set(url, { data, timestamp: Date.now() });
      } else {
        cache.clear();
      }
      return data;
    } catch (e) {
      throw new Error(`Invalid JSON response from server. Response was: ${text.substring(0, 100)}...`);
    }
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error;
  }
}

export const api = {
  login: async (adminId: string, password: string):Promise<any> => {
    return fetchJson('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId, password }),
    });
  },
  resetPassword: async (email: string, previousPassword?: string, newPassword?: string):Promise<any> => {
    return fetchJson('/api/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, previousPassword, newPassword }),
    });
  },
  // Employees
  getEmployees: async (): Promise<Employee[]> => {
    return fetchJson('/api/employees');
  },
  saveEmployee: async (employee: Employee): Promise<void> => {
    await fetchJson('/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(employee),
    });
  },
  deleteEmployee: async (id: string): Promise<void> => {
    await fetchJson(`/api/employees/${id}`, { method: 'DELETE' });
  },

  // Salaries
  getSalaries: async (): Promise<Salary[]> => {
    return fetchJson('/api/salaries');
  },
  saveSalary: async (salary: Salary): Promise<void> => {
    await fetchJson('/api/salaries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(salary),
    });
  },
  deleteSalary: async (id: string): Promise<void> => {
    await fetchJson(`/api/salaries/${id}`, { method: 'DELETE' });
  },

  // Sales
  getSales: async (): Promise<Sale[]> => {
    return fetchJson('/api/sales');
  },
  saveSale: async (sale: Sale): Promise<void> => {
    await fetchJson('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sale),
    });
  },
  deleteSale: async (id: string): Promise<void> => {
    await fetchJson(`/api/sales/${id}`, { method: 'DELETE' });
  },

  // Transactions
  getTransactions: async (): Promise<Transaction[]> => {
    return fetchJson('/api/transactions');
  },
  saveTransaction: async (transaction: Transaction): Promise<void> => {
    await fetchJson('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transaction),
    });
  },
  deleteTransaction: async (id: string): Promise<void> => {
    await fetchJson(`/api/transactions/${id}`, { method: 'DELETE' });
  },

  // Roster
  getRoster: async (): Promise<Shift[]> => {
    return fetchJson('/api/roster');
  },
  saveShift: async (shift: Shift): Promise<void> => {
    console.log('Sending shift update to server:', shift);
    const response = await fetchJson('/api/roster', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(shift),
    });
    console.log('Server response for shift update:', response);
  },
  deleteShift: async (id: string): Promise<void> => {
    await fetchJson(`/api/roster/${id}`, { method: 'DELETE' });
  },

  // Instructions
  getInstructions: async (): Promise<InstructionCard[]> => {
    return fetchJson('/api/instructions');
  },
  saveInstruction: async (instruction: InstructionCard): Promise<void> => {
    await fetchJson('/api/instructions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(instruction),
    });
  },
  deleteInstruction: async (id: string): Promise<void> => {
    await fetchJson(`/api/instructions/${id}`, { method: 'DELETE' });
  },

  // Resources
  getResources: async (): Promise<Resource[]> => {
    return fetchJson('/api/resources');
  },
  saveResource: async (resource: Resource): Promise<void> => {
    await fetchJson('/api/resources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resource),
    });
  },
  deleteResource: async (id: string): Promise<void> => {
    await fetchJson(`/api/resources/${id}`, { method: 'DELETE' });
  },

  // Order List
  getOrderList: async (): Promise<OrderRecord[]> => {
    return fetchJson('/api/order-list');
  },
  saveOrder: async (order: OrderRecord): Promise<void> => {
    await fetchJson('/api/order-list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
  },
  deleteOrder: async (id: string): Promise<void> => {
    await fetchJson(`/api/order-list/${id}`, { method: 'DELETE' });
  },

  // Notifications
  getNotifications: async (): Promise<AppNotification[]> => {
    return fetchJson('/api/notifications');
  },
  markNotificationsRead: async (): Promise<void> => {
    await fetchJson('/api/notifications/read', { method: 'POST' });
  },

  // Shift Tasks
  getShiftTasks: async (): Promise<any> => {
    return fetchJson('/api/shift-tasks');
  },
  saveShiftTasks: async (tasks: any): Promise<void> => {
    await fetchJson('/api/shift-tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tasks),
    });
  },

  clearAllData: async (): Promise<void> => {
    await fetchJson('/api/clear-all', { method: 'POST' });
  },

  healthCheck: async (): Promise<any> => {
    return fetchJson('/api/health');
  },
  seedDatabase: async (): Promise<void> => {
    await fetchJson('/api/seed', { method: 'POST' });
  },

  // Documents
  getDocuments: async (): Promise<AppDocument[]> => {
    return fetchJson('/api/documents');
  },
  saveDocument: async (doc: AppDocument): Promise<void> => {
    await fetchJson('/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doc),
    });
  },
  deleteDocument: async (id: string): Promise<void> => {
    await fetchJson(`/api/documents/${id}`, { method: 'DELETE' });
  },

  // App Settings
  getAppSettings: async (): Promise<AppSettings> => {
    return fetchJson('/api/app-settings');
  },
  saveAppSettings: async (settings: AppSettings): Promise<AppSettings> => {
    return fetchJson('/api/app-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
  },
};
