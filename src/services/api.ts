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
  signup: async (userData: any): Promise<any> => {
    return fetchJson('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
  },
  socialLogin: async (socialData: any): Promise<any> => {
    return fetchJson('/api/social-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(socialData),
    });
  },
  resetPassword: async (email: string, previousPassword?: string, newPassword?: string):Promise<any> => {
    return fetchJson('/api/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, previousPassword, newPassword }),
    });
  },
  // Wishlist
  getWishlist: async (userId: string): Promise<any> => {
    return fetchJson(`/api/ecommerce/wishlist/${userId}`);
  },
  getAllWishlists: async (): Promise<any> => {
    return fetchJson('/api/ecommerce/wishlist/all');
  },
  addToWishlist: async (userId: string, productId: string): Promise<any> => {
    return fetchJson('/api/ecommerce/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, productId }),
    });
  },
  removeFromWishlist: async (userId: string, productId: string): Promise<any> => {
    return fetchJson(`/api/ecommerce/wishlist/${userId}/${productId}`, {
      method: 'DELETE',
    });
  },
  // Cart
  getCart: async (userId: string): Promise<any> => {
    return fetchJson(`/api/ecommerce/cart/${userId}`);
  },
  getAllCartItems: async (): Promise<any> => {
    return fetchJson('/api/ecommerce/cart/all');
  },
  addToCart: async (userId: string, productId: string, quantity: number, color?: string): Promise<any> => {
    return fetchJson('/api/ecommerce/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, productId, quantity, color }),
    });
  },
  updateCartItem: async (userId: string, productId: string, quantity: number): Promise<any> => {
    return fetchJson('/api/ecommerce/cart', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, productId, quantity }),
    });
  },
  removeFromCart: async (userId: string, productId: string): Promise<any> => {
    return fetchJson(`/api/ecommerce/cart/${userId}/${productId}`, {
      method: 'DELETE',
    });
  },
  // Theme
  getUserTheme: async (userId: string): Promise<any> => {
    return fetchJson(`/api/ecommerce/theme/${userId}`);
  },
  updateUserTheme: async (userId: string, theme: string, isDark: boolean): Promise<any> => {
    return fetchJson('/api/ecommerce/theme', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, theme, isDark }),
    });
  },
  // Categories
  getCategories: async (): Promise<any> => {
    return fetchJson('/api/ecommerce/categories');
  },
  createCategory: async (category: any): Promise<any> => {
    return fetchJson('/api/ecommerce/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category),
    });
  },
  updateCategory: async (id: string, category: any): Promise<any> => {
    return fetchJson(`/api/ecommerce/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category),
    });
  },
  deleteCategory: async (id: string): Promise<any> => {
    return fetchJson(`/api/ecommerce/categories/${id}`, {
      method: 'DELETE',
    });
  },
  // Products
  getProducts: async (categoryId?: string, search?: string): Promise<any> => {
    let url = '/api/ecommerce/products';
    const params = new URLSearchParams();
    if (categoryId) params.append('categoryId', categoryId);
    if (search) params.append('search', search);
    if (params.toString()) url += `?${params.toString()}`;
    return fetchJson(url);
  },
  getProductById: async (id: string): Promise<any> => {
    return fetchJson(`/api/ecommerce/products/${id}`);
  },
  createProduct: async (product: any): Promise<any> => {
    return fetchJson('/api/ecommerce/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
  },
  updateProduct: async (id: string, product: any): Promise<any> => {
    return fetchJson(`/api/ecommerce/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
  },
  deleteProduct: async (id: string): Promise<any> => {
    return fetchJson(`/api/ecommerce/products/${id}`, {
      method: 'DELETE',
    });
  },
  // Site Assets
  getSiteAssets: async (): Promise<any> => {
    return fetchJson('/api/ecommerce/site-assets');
  },
  createSiteAsset: async (asset: any): Promise<any> => {
    return fetchJson('/api/ecommerce/site-assets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(asset),
    });
  },
  updateSiteAsset: async (id: string, asset: any): Promise<any> => {
    return fetchJson(`/api/ecommerce/site-assets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(asset),
    });
  },
  deleteSiteAsset: async (id: string): Promise<any> => {
    return fetchJson(`/api/ecommerce/site-assets/${id}`, {
      method: 'DELETE',
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

  // Orders
  getAllOrders: async (): Promise<any> => {
    return fetchJson('/api/ecommerce/orders');
  },
  createOrder: async (orderData: any): Promise<any> => {
    return fetchJson('/api/ecommerce/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });
  },
  getOrdersByUserId: async (userId: string): Promise<any> => {
    return fetchJson(`/api/ecommerce/orders/user/${userId}`);
  },

  // Legacy Order List (for other views)
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

  // Ecommerce Settings
  getEcommerceSettings: async (): Promise<any> => {
    return fetchJson('/api/ecommerce/settings');
  },
  updateEcommerceSettings: async (settings: any): Promise<any> => {
    return fetchJson('/api/ecommerce/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
  },
};
