import React, { useState, useEffect } from 'react';
import { 
  Store, 
  Package, 
  Tags, 
  Image as ImageIcon, 
  ShoppingCart, 
  History, 
  Heart, 
  Palette, 
  ChevronRight,
  Plus,
  ArrowLeft,
  Trash2,
  Edit2,
  Save,
  X,
  Settings,
  Globe,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Instagram,
  Twitter,
  Upload
} from 'lucide-react';
import { cn } from '../utils';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../services/api';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

type SubView = 'main' | 'products' | 'categories' | 'assets' | 'orders' | 'cart-items' | 'wishlist' | 'themes' | 'settings';

export const ControlStoreView: React.FC = () => {
  const [activeSubView, setActiveSubView] = useState<SubView>('main');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const { theme, setTheme, isDarkMode, toggleDarkMode } = useTheme();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [ecommerceSettings, setEcommerceSettings] = useState<any>({
    shop_name: '',
    footer_about: '',
    contact_email: '',
    contact_phone: '',
    contact_address: '',
    social_links: { facebook: '', instagram: '', twitter: '' }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<any>(null);

  useEffect(() => {
    const loadOverviewData = async () => {
      setIsLoading(true);
      try {
        const [p, c, a, s, o, ci, w] = await Promise.all([
          api.getProducts(),
          api.getCategories(),
          api.getSiteAssets(),
          api.getEcommerceSettings(),
          api.getAllOrders(),
          api.getAllCartItems(),
          api.getAllWishlists()
        ]);
        setProducts(Array.isArray(p) ? p : []);
        setCategories(Array.isArray(c) ? c : []);
        setAssets(Array.isArray(a) ? a : []);
        setEcommerceSettings(s);
        setOrders(Array.isArray(o) ? o : []);
        setCartItems(Array.isArray(ci) ? ci : []);
        setWishlistItems(Array.isArray(w) ? w : []);
      } catch (err) {
        console.error("Error loading store data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadOverviewData();
  }, []);

  useEffect(() => {
    if (activeSubView === 'products') fetchProducts();
    if (activeSubView === 'categories') fetchCategories();
    if (activeSubView === 'assets') fetchAssets();
    if (activeSubView === 'settings') fetchSettings();
    if (activeSubView === 'orders') fetchOrders();
    if (activeSubView === 'cart-items') fetchCartItems();
    if (activeSubView === 'wishlist') fetchWishlist();
  }, [activeSubView]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const data = await api.getProducts();
      console.log("Fetched products:", data);
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch products:", err);
      toast.error("Failed to fetch products");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const data = await api.getCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error("Failed to fetch categories");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAssets = async () => {
    setIsLoading(true);
    try {
      const data = await api.getSiteAssets();
      setAssets(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error("Failed to fetch assets");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const data = await api.getEcommerceSettings();
      setEcommerceSettings(data);
    } catch (err) {
      toast.error("Failed to fetch settings");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAllOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error("Failed to fetch orders");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCartItems = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAllCartItems();
      setCartItems(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error("Failed to fetch cart items");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWishlist = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAllWishlists();
      setWishlistItems(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error("Failed to fetch wishlist");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await api.updateEcommerceSettings(ecommerceSettings);
      toast.success("Settings updated successfully");
    } catch (err) {
      toast.error("Failed to update settings");
    } finally {
      setIsSaving(false);
    }
  };

  const openModal = (mode: 'create' | 'edit', item?: any) => {
    setModalMode(mode);
    setEditingItem(item || (
      activeSubView === 'products' ? { name: '', price: 0, stock_quantity: 0, category_id: categories[0]?.id || '', images: [], details: '', colors: [] } :
      activeSubView === 'categories' ? { name: '', slug: '', image_url: '', description: '' } :
      activeSubView === 'assets' ? { title: '', subtitle: '', type: 'banner', image_url: '', link_url: '', is_active: true } : {}
    ));
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (activeSubView === 'products') {
        if (modalMode === 'create') await api.createProduct(editingItem);
        else await api.updateProduct(editingItem.id, editingItem);
        fetchProducts();
      } else if (activeSubView === 'categories') {
        if (modalMode === 'create') await api.createCategory(editingItem);
        else await api.updateCategory(editingItem.id, editingItem);
        fetchCategories();
      } else if (activeSubView === 'assets') {
        if (modalMode === 'create') await api.createSiteAsset(editingItem);
        else await api.updateSiteAsset(editingItem.id, editingItem);
        fetchAssets();
      }
      toast.success(`${activeSubView.slice(0, -1)} ${modalMode === 'create' ? 'created' : 'updated'} successfully`);
      setIsModalOpen(false);
    } catch (err) {
      console.error("Failed to create/update product:", err);
      toast.error(`Failed to ${modalMode} ${activeSubView.slice(0, -1)}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Are you sure you want to delete this ${activeSubView.slice(0, -1)}?`)) return;
    try {
      if (activeSubView === 'products') await api.deleteProduct(id);
      else if (activeSubView === 'categories') await api.deleteCategory(id);
      else if (activeSubView === 'assets') await api.deleteSiteAsset(id);
      toast.success(`${activeSubView.slice(0, -1)} deleted successfully`);
      if (activeSubView === 'products') fetchProducts();
      else if (activeSubView === 'categories') fetchCategories();
      else if (activeSubView === 'assets') fetchAssets();
    } catch (err) {
      toast.error(`Failed to delete ${activeSubView.slice(0, -1)}`);
    }
  };

  const cards = [
    { id: 'products', title: 'Products', icon: Package, description: 'Manage your product inventory', color: 'bg-blue-500' },
    { id: 'categories', title: 'Categories', icon: Tags, description: 'Organize products into categories', color: 'bg-emerald-500' },
    { id: 'assets', title: 'Site Assets', icon: ImageIcon, description: 'Manage banners and banners', color: 'bg-amber-500' },
    { id: 'settings', title: 'Store Info', icon: Globe, description: 'Shop name, footer, and contact', color: 'bg-cyan-500' },
    { id: 'orders', title: 'Orders', icon: History, description: 'View and manage customer orders', color: 'bg-purple-500' },
    { id: 'cart-items', title: 'Cart Items', icon: ShoppingCart, description: 'See what customers are adding to cart', color: 'bg-rose-500' },
    { id: 'wishlist', title: 'Wishlist', icon: Heart, description: 'Monitor popular products', color: 'bg-pink-500' },
    { id: 'themes', title: 'Themes', icon: Palette, description: 'Control application appearance', color: 'bg-indigo-500' },
  ];

  if (activeSubView !== 'main') {
    return (
      <div className="space-y-6">
        <button 
          onClick={() => setActiveSubView('main')}
          className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-bold uppercase tracking-widest text-xs"
        >
          <ArrowLeft size={16} />
          Back to Control Store
        </button>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 rounded-[2.5rem]"
        >
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-black tracking-tight capitalize">{activeSubView.replace('-', ' ')}</h2>
            {activeSubView === 'settings' && (
              <button 
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="btn-primary flex items-center gap-2 px-8"
              >
                {isSaving ? 'Saving...' : <><Save size={18} /> Save Changes</>}
              </button>
            )}
          </div>
          
          {activeSubView === 'settings' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <h3 className="text-lg font-black uppercase tracking-wider text-slate-400">Basic Information</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest ml-1">Shop Name</label>
                    <input 
                      type="text" 
                      value={ecommerceSettings.shop_name}
                      onChange={(e) => setEcommerceSettings({...ecommerceSettings, shop_name: e.target.value})}
                      className="w-full p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/20 focus:ring-2 focus:ring-primary outline-none font-bold"
                      placeholder="Enter shop name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest ml-1">Footer About Text</label>
                    <textarea 
                      value={ecommerceSettings.footer_about}
                      onChange={(e) => setEcommerceSettings({...ecommerceSettings, footer_about: e.target.value})}
                      className="w-full p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/20 focus:ring-2 focus:ring-primary outline-none font-bold h-32"
                      placeholder="Enter footer description"
                    />
                  </div>
                </div>

                <h3 className="text-lg font-black uppercase tracking-wider text-slate-400 mt-10">Social Links</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500"><Facebook size={20} /></div>
                    <input 
                      type="text" 
                      value={ecommerceSettings.social_links?.facebook || ''}
                      onChange={(e) => setEcommerceSettings({
                        ...ecommerceSettings, 
                        social_links: { ...ecommerceSettings.social_links, facebook: e.target.value }
                      })}
                      className="flex-1 p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/20 focus:ring-2 focus:ring-primary outline-none font-bold"
                      placeholder="Facebook URL"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-500"><Instagram size={20} /></div>
                    <input 
                      type="text" 
                      value={ecommerceSettings.social_links?.instagram || ''}
                      onChange={(e) => setEcommerceSettings({
                        ...ecommerceSettings, 
                        social_links: { ...ecommerceSettings.social_links, instagram: e.target.value }
                      })}
                      className="flex-1 p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/20 focus:ring-2 focus:ring-primary outline-none font-bold"
                      placeholder="Instagram URL"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-lg font-black uppercase tracking-wider text-slate-400">Contact Details</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest ml-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="email" 
                        value={ecommerceSettings.contact_email}
                        onChange={(e) => setEcommerceSettings({...ecommerceSettings, contact_email: e.target.value})}
                        className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/20 focus:ring-2 focus:ring-primary outline-none font-bold"
                        placeholder="contact@shop.com"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest ml-1">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        value={ecommerceSettings.contact_phone}
                        onChange={(e) => setEcommerceSettings({...ecommerceSettings, contact_phone: e.target.value})}
                        className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/20 focus:ring-2 focus:ring-primary outline-none font-bold"
                        placeholder="+1 234 567 890"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest ml-1">Physical Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-4 text-slate-400" size={18} />
                      <textarea 
                        value={ecommerceSettings.contact_address}
                        onChange={(e) => setEcommerceSettings({...ecommerceSettings, contact_address: e.target.value})}
                        className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/20 focus:ring-2 focus:ring-primary outline-none font-bold h-24"
                        placeholder="Shop address"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSubView === 'products' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                <h3 className="text-lg font-bold">Product List</h3>
                <div className="flex items-center gap-2">
                  <div className="flex bg-slate-100 dark:bg-slate-700 rounded-xl p-1">
                    <button 
                      onClick={() => setViewMode('table')}
                      className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all", viewMode === 'table' ? "bg-white dark:bg-slate-600 shadow-sm" : "text-slate-500")}
                    >
                      Table
                    </button>
                    <button 
                      onClick={() => setViewMode('card')}
                      className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all", viewMode === 'card' ? "bg-white dark:bg-slate-600 shadow-sm" : "text-slate-500")}
                    >
                      Card
                    </button>
                  </div>
                  <button 
                    onClick={() => openModal('create')}
                    className="btn-primary flex items-center gap-2 px-6"
                  >
                    <Plus size={18} /> Add Product
                  </button>
                </div>
              </div>
              {viewMode === 'table' ? (
                <div className="overflow-x-auto glass-card rounded-[2rem] p-4">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800">
                        <th className="py-4 px-2">Product</th>
                        <th className="py-4 px-2">Category</th>
                        <th className="py-4 px-2">Price</th>
                        <th className="py-4 px-2">Stock</th>
                        <th className="py-4 px-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map(product => (
                        <tr key={product.id} className="border-b border-slate-100 dark:border-slate-900 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                          <td className="py-4 px-2">
                            <div className="flex items-center gap-3">
                              <img 
                                src={product.images?.[0] || 'https://picsum.photos/seed/product/50/50'} 
                                alt={product.name}
                                className="w-12 h-12 rounded-xl object-cover shadow-sm"
                              />
                              <div>
                                <p className="font-bold">{product.name}</p>
                                <p className="text-xs text-slate-500 font-mono">{product.id.substring(0, 8)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-2">
                            <span className="px-3 py-1 bg-slate-100 dark:bg-white/5 rounded-full text-xs font-bold">
                              {product.categories?.name || 'Uncategorized'}
                            </span>
                          </td>
                          <td className="py-4 px-2 font-black text-primary">${product.price}</td>
                          <td className="py-4 px-2">
                            <span className={cn(
                              "font-bold",
                              product.stock_quantity < 10 ? "text-rose-500" : "text-emerald-500"
                            )}>
                              {product.stock_quantity}
                            </span>
                          </td>
                          <td className="py-4 px-2 text-right">
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => openModal('edit', product)}
                                className="p-2 hover:bg-blue-500/10 rounded-xl text-blue-500 transition-colors"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button 
                                onClick={() => handleDelete(product.id)}
                                className="p-2 hover:bg-rose-500/10 rounded-xl text-rose-500 transition-colors"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.map(product => (
                    <div key={product.id} className="glass-card p-6 rounded-[2rem] space-y-4 hover:border-primary transition-all">
                      <img 
                        src={product.images?.[0] || 'https://picsum.photos/seed/product/200/200'} 
                        alt={product.name}
                        className="w-full h-48 rounded-2xl object-cover"
                      />
                      <div>
                        <p className="font-bold text-xl">{product.name}</p>
                        <p className="text-sm text-slate-500 line-clamp-2">{product.description}</p>
                      </div>
                      <div className="flex justify-between items-center font-black text-primary text-lg">
                        <span>${product.price}</span>
                        <span className="text-xs text-slate-400 font-mono">Stock: {product.stock_quantity}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex -space-x-2">
                          {product.colors?.map((color: string, i: number) => (
                            <div key={i} className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900" style={{ backgroundColor: color }} />
                          ))}
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => openModal('edit', product)} className="p-2 hover:bg-blue-500/10 rounded-xl text-blue-500"><Edit2 size={16} /></button>
                          <button onClick={() => handleDelete(product.id)} className="p-2 hover:bg-rose-500/10 rounded-xl text-rose-500"><Trash2 size={16} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {products.length === 0 && !isLoading && (
                    <div className="col-span-full py-20 text-center text-slate-500 font-bold">No products found. Start adding some!</div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeSubView === 'categories' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">Category List</h3>
                <button 
                  onClick={() => openModal('create')}
                  className="btn-primary flex items-center gap-2"
                >
                  <Plus size={18} /> Add Category
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map(cat => (
                  <div key={cat.id} className="p-6 rounded-[2rem] border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/20 flex items-center justify-between group hover:border-primary transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center overflow-hidden">
                        {cat.image_url ? (
                          <img src={cat.image_url} className="w-full h-full object-cover" />
                        ) : (
                          <Tags className="text-primary" size={24} />
                        )}
                      </div>
                      <div>
                        <p className="font-black">{cat.name}</p>
                        <p className="text-xs text-slate-500 font-mono">/{cat.slug}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => openModal('edit', cat)}
                        className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-xl"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(cat.id)}
                        className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSubView === 'assets' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">Site Assets</h3>
                <button 
                  onClick={() => openModal('create')}
                  className="btn-primary flex items-center gap-2"
                >
                  <Plus size={18} /> Add Asset
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {assets.map(asset => (
                  <div key={asset.id} className="p-6 rounded-[2.5rem] border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/20 group overflow-hidden">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-full uppercase mb-3 inline-block tracking-widest">
                          {asset.type}
                        </span>
                        <h4 className="text-xl font-black tracking-tight">{asset.title || 'Untitled Asset'}</h4>
                        <p className="text-slate-500 text-sm font-semibold">{asset.subtitle}</p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => openModal('edit', asset)}
                          className="p-3 bg-white dark:bg-white/5 rounded-2xl text-blue-500 shadow-sm hover:shadow-md transition-all"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(asset.id)}
                          className="p-3 bg-white dark:bg-white/5 rounded-2xl text-rose-500 shadow-sm hover:shadow-md transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    {asset.image_url && (
                      <div className="relative h-48 rounded-[1.5rem] overflow-hidden">
                        <img src={asset.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSubView === 'orders' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold">Order History</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800">
                      <th className="py-4 px-2">Order ID</th>
                      <th className="py-4 px-2">Customer</th>
                      <th className="py-4 px-2">Total</th>
                      <th className="py-4 px-2">Status</th>
                      <th className="py-4 px-2">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(order => (
                      <tr key={order.id} className="border-b border-slate-100 dark:border-slate-900 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                        <td className="py-4 px-2 font-mono text-xs font-bold">#{order.id.substring(0, 8)}</td>
                        <td className="py-4 px-2">
                          <p className="font-bold">{order.user_info?.name || 'Guest'}</p>
                          <p className="text-xs text-slate-500">{order.user_info?.email}</p>
                        </td>
                        <td className="py-4 px-2 font-black text-primary">${order.total_price}</td>
                        <td className="py-4 px-2">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                            order.status === 'completed' ? "bg-emerald-500/10 text-emerald-500" :
                            order.status === 'pending' ? "bg-amber-500/10 text-amber-500" :
                            "bg-slate-500/10 text-slate-500"
                          )}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-4 px-2 text-sm text-slate-500">{new Date(order.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {orders.length === 0 && !isLoading && (
                      <tr>
                        <td colSpan={5} className="py-20 text-center text-slate-500 font-bold">No orders found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSubView === 'themes' && (
            <div className="space-y-10">
              <div>
                <h3 className="text-lg font-black uppercase tracking-wider text-slate-400 mb-6">Select Visual Theme</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                  {(['classic', 'modern', 'vibrant', 'minimal'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      className={cn(
                        "p-6 rounded-[2rem] border-2 transition-all text-center capitalize font-black text-lg shadow-sm",
                        theme === t 
                          ? "border-primary bg-primary/10 text-primary shadow-primary/20" 
                          : "border-slate-200 dark:border-white/10 hover:border-primary/50 dark:hover:border-primary/50"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-black uppercase tracking-wider text-slate-400 mb-6">Display Mode</h3>
                <button
                  onClick={toggleDarkMode}
                  className="flex items-center gap-4 px-10 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[1.5rem] font-black text-lg shadow-xl"
                >
                  {isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                </button>
              </div>
            </div>
          )}

          {activeSubView === 'cart-items' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold">Active Carts</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800">
                      <th className="py-4 px-2">Customer</th>
                      <th className="py-4 px-2">Product</th>
                      <th className="py-4 px-2">Qty</th>
                      <th className="py-4 px-2">Added At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cartItems.map((item, idx) => (
                      <tr key={idx} className="border-b border-slate-100 dark:border-slate-900">
                        <td className="py-4 px-2">
                          <p className="font-bold">{item.employees?.full_name || 'Guest'}</p>
                          <p className="text-xs text-slate-500">{item.employees?.email}</p>
                        </td>
                        <td className="py-4 px-2">
                          <div className="flex items-center gap-2">
                            <img src={item.products?.image_url} className="w-8 h-8 rounded-lg object-cover" />
                            <span className="font-bold">{item.products?.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-2 font-black">{item.quantity}</td>
                        <td className="py-4 px-2 text-sm text-slate-500">{new Date(item.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                    {cartItems.length === 0 && !isLoading && (
                      <tr>
                        <td colSpan={4} className="py-20 text-center text-slate-500 font-bold">No active carts.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSubView === 'wishlist' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold">Wishlist Monitoring</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800">
                      <th className="py-4 px-2">Customer</th>
                      <th className="py-4 px-2">Product</th>
                      <th className="py-4 px-2">Added At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wishlistItems.map((item, idx) => (
                      <tr key={idx} className="border-b border-slate-100 dark:border-slate-900">
                        <td className="py-4 px-2">
                          <p className="font-bold">{item.employees?.full_name || 'Guest'}</p>
                          <p className="text-xs text-slate-500">{item.employees?.email}</p>
                        </td>
                        <td className="py-4 px-2">
                          <div className="flex items-center gap-2">
                            <img src={item.products?.image_url} className="w-8 h-8 rounded-lg object-cover" />
                            <span className="font-bold">{item.products?.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-2 text-sm text-slate-500">{new Date(item.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                    {wishlistItems.length === 0 && !isLoading && (
                      <tr>
                        <td colSpan={3} className="py-20 text-center text-slate-500 font-bold">No wishlist items.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>

        {/* Modal for CRUD */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsModalOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="glass-card w-full max-w-2xl p-8 rounded-[3rem] relative z-10 shadow-2xl"
              >
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-3xl font-black tracking-tight capitalize">
                    {modalMode} {activeSubView.slice(0, -1)}
                  </h2>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleModalSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {activeSubView === 'products' && (
                      <>
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest ml-1">Product Name</label>
                          <input 
                            required
                            type="text" 
                            value={editingItem.name ?? ''}
                            onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                            className="w-full p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/20 focus:ring-2 focus:ring-primary outline-none font-bold"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest ml-1">Price ($)</label>
                          <input 
                            required
                            type="number" 
                            step="0.01"
                            value={editingItem.price ?? ''}
                            onChange={(e) => setEditingItem({...editingItem, price: e.target.value === '' ? '' : parseFloat(e.target.value)})}
                            className="w-full p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/20 focus:ring-2 focus:ring-primary outline-none font-bold"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest ml-1">Stock Quantity</label>
                          <input 
                            required
                            type="number" 
                            value={editingItem.stock_quantity ?? ''}
                            onChange={(e) => setEditingItem({...editingItem, stock_quantity: e.target.value === '' ? '' : parseInt(e.target.value)})}
                            className="w-full p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/20 focus:ring-2 focus:ring-primary outline-none font-bold"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest ml-1">Category</label>
                          <select 
                            required
                            value={editingItem.category_id ?? ''}
                            onChange={(e) => setEditingItem({...editingItem, category_id: e.target.value})}
                            className="w-full p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/20 focus:ring-2 focus:ring-primary outline-none font-bold"
                          >
                            <option value="">Select Category</option>
                            {categories.map(cat => (
                              <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-xs font-black uppercase tracking-widest ml-1">Colors</label>
                          <div className="flex gap-2 items-center">
                            <input 
                              type="color" 
                              onChange={(e) => setEditingItem({...editingItem, colors: [...(editingItem.colors || []), e.target.value]})}
                              className="w-12 h-12 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/20"
                            />
                            <div className="flex flex-wrap gap-2">
                              {Array.isArray(editingItem.colors) && editingItem.colors.map((color: string, index: number) => (
                                <div key={index} className="relative group">
                                  <div className="w-10 h-10 rounded-full border border-slate-200" style={{ backgroundColor: color }} />
                                  <button 
                                    type="button"
                                    onClick={() => setEditingItem({...editingItem, colors: editingItem.colors.filter((_: any, i: number) => i !== index)})}
                                    className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-xs font-black uppercase tracking-widest ml-1">Images (URLs)</label>
                          <input 
                            type="text" 
                            placeholder="Add image URL and press Enter"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                setEditingItem({...editingItem, images: [...(editingItem.images || []), e.currentTarget.value]});
                                e.currentTarget.value = '';
                              }
                            }}
                            className="w-full p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/20 focus:ring-2 focus:ring-primary outline-none font-bold"
                          />
                          <div className="flex flex-wrap gap-2 mt-2">
                            {Array.isArray(editingItem.images) && editingItem.images.map((url: string, index: number) => (
                              <div key={index} className="relative group">
                                <img src={url} className="w-20 h-20 rounded-xl object-cover border border-slate-200" />
                                <button 
                                  type="button"
                                  onClick={() => setEditingItem({...editingItem, images: editingItem.images.filter((_: any, i: number) => i !== index)})}
                                  className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-xs font-black uppercase tracking-widest ml-1">Details</label>
                          <textarea 
                            value={editingItem.details ?? ''}
                            onChange={(e) => setEditingItem({...editingItem, details: e.target.value})}
                            className="w-full p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/20 focus:ring-2 focus:ring-primary outline-none font-bold h-32"
                          />
                        </div>
                      </>
                    )}

                    {activeSubView === 'categories' && (
                      <>
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest ml-1">Category Name</label>
                          <input 
                            required
                            type="text" 
                            value={editingItem.name}
                            onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                            className="w-full p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/20 focus:ring-2 focus:ring-primary outline-none font-bold"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest ml-1">Slug</label>
                          <input 
                            required
                            type="text" 
                            value={editingItem.slug}
                            onChange={(e) => setEditingItem({...editingItem, slug: e.target.value})}
                            className="w-full p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/20 focus:ring-2 focus:ring-primary outline-none font-bold"
                          />
                        </div>
                      </>
                    )}

                    {activeSubView === 'assets' && (
                      <>
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest ml-1">Asset Title</label>
                          <input 
                            required
                            type="text" 
                            value={editingItem.title}
                            onChange={(e) => setEditingItem({...editingItem, title: e.target.value})}
                            className="w-full p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/20 focus:ring-2 focus:ring-primary outline-none font-bold"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest ml-1">Asset Type</label>
                          <select 
                            required
                            value={editingItem.type}
                            onChange={(e) => setEditingItem({...editingItem, type: e.target.value})}
                            className="w-full p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/20 focus:ring-2 focus:ring-primary outline-none font-bold"
                          >
                            <option value="hero">Hero Banner</option>
                            <option value="banner">Sub Banner</option>
                            <option value="promo">Promo Card</option>
                            <option value="logo">Logo</option>
                          </select>
                        </div>
                      </>
                    )}

                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-black uppercase tracking-widest ml-1">Image URL or Upload</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={editingItem.image_url || ''}
                          onChange={(e) => setEditingItem({...editingItem, image_url: e.target.value})}
                          className="flex-1 p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/20 focus:ring-2 focus:ring-primary outline-none font-bold"
                          placeholder="https://example.com/image.jpg"
                        />
                        <label className="flex items-center justify-center px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                          <Upload size={20} className="text-slate-500" />
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setEditingItem({...editingItem, image_url: reader.result as string});
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </div>
                      {editingItem.image_url && (
                        <div className="mt-2 h-32 w-32 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                          <img src={editingItem.image_url} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-black uppercase tracking-widest ml-1">Description / Subtitle</label>
                      <textarea 
                        value={editingItem.description || editingItem.subtitle || ''}
                        onChange={(e) => setEditingItem({
                          ...editingItem, 
                          [activeSubView === 'assets' ? 'subtitle' : 'description']: e.target.value
                        })}
                        className="w-full p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/20 focus:ring-2 focus:ring-primary outline-none font-bold h-24"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-4 pt-6">
                    <button 
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={isSaving}
                      className="btn-primary px-10 py-4 flex items-center gap-2"
                    >
                      {isSaving ? 'Processing...' : <><Save size={18} /> {modalMode === 'create' ? 'Create' : 'Update'}</>}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white">Control Store</h1>
        <p className="text-lg text-slate-500 dark:text-slate-300 font-semibold">Manage your e-commerce platform, appearance, and dynamic content.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <motion.button
            key={card.id}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveSubView(card.id as SubView)}
            className="glass-card glass-card-hover p-8 text-left group relative overflow-hidden rounded-[2.5rem] border border-white/20 dark:border-white/5"
          >
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-white shadow-2xl", card.color)}>
              <card.icon size={28} />
            </div>
            <h3 className="text-2xl font-black mb-2 tracking-tight">{card.title}</h3>
            <p className="text-slate-500 text-sm font-semibold mb-6 leading-relaxed">{card.description}</p>
            <div className="flex items-center text-primary font-black text-xs uppercase tracking-widest group-hover:gap-3 transition-all">
              Manage Now
              <ChevronRight size={16} />
            </div>
            
            {/* Decorative background element */}
            <div className={cn("absolute -right-6 -bottom-6 w-32 h-32 rounded-full opacity-5 group-hover:opacity-10 transition-opacity blur-2xl", card.color)} />
          </motion.button>
        ))}
      </div>

      {/* Quick Stats / Admin Hub Summary */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-10 rounded-[3rem] border border-white/20 dark:border-white/5"
      >
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-2xl font-black tracking-tight">Store Overview</h2>
          <button className="text-primary font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:underline underline-offset-4">
            Full Analytics <ChevronRight size={16} />
          </button>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-10">
          {[
            { label: 'Total Products', value: products.length, color: 'text-blue-500' },
            { label: 'Active Orders', value: orders.filter(o => o.status === 'pending').length, color: 'text-purple-500' },
            { label: 'Cart Items', value: cartItems.length, color: 'text-rose-500' },
            { label: 'Wishlists', value: wishlistItems.length, color: 'text-pink-500' }
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-slate-400 text-[10px] mb-2 uppercase tracking-[0.2em] font-black">{stat.label}</p>
              <p className={cn("text-5xl font-black tracking-tighter", stat.color)}>{stat.value}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
