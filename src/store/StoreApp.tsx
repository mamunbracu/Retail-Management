import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, Search, User, Menu, X, ChevronRight, Instagram, Facebook, Twitter, Phone, Mail, MapPin, Shield, LogOut } from 'lucide-react';
import { useStore } from './StoreContext';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { cn } from '../utils';
import { motion, AnimatePresence } from 'motion/react';

// Views
import { HomeView } from './views/HomeView';
import { ProductDetailView } from './views/ProductDetailView';
import { CartView } from './views/CartView';
import { WishlistView } from './views/WishlistView';
import { OrderTrackingView } from './views/OrderTrackingView';
import { ContactView } from './views/ContactView';
import { CategoryView } from './views/CategoryView';

export const StoreApp: React.FC = () => {
  const { cart, wishlist } = useStore();
  const { user, isAdmin, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [siteAssets, setSiteAssets] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.remove('dark');
    const fetchData = async () => {
      try {
        const [catsRes, assetsRes] = await Promise.all([
          fetch('/api/ecommerce/categories').then(res => res.json()),
          fetch('/api/ecommerce/site-assets').then(res => res.json())
        ]);
        
        setCategories(Array.isArray(catsRes) ? catsRes : []);
        setSiteAssets(Array.isArray(assetsRes) ? assetsRes : []);
      } catch (error) {
        console.error('Failed to fetch store data:', error);
      }
    };
    fetchData();
  }, []);

  const footerAsset = siteAssets.find(a => a.type === 'footer');
  const footerContent = footerAsset ? JSON.parse(footerAsset.content) : null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0B0F19] text-slate-900 dark:text-slate-50 font-sans flex flex-col transition-colors duration-300">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-[#0B0F19]/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 lg:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                <span className="font-bold text-xl">F</span>
              </div>
              <span className="font-bold text-xl tracking-tight hidden sm:block">Firestation</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-8">
              <Link to="/" className="text-sm font-medium hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Home</Link>
              <div className="relative group">
                <button className="text-sm font-medium hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1">
                  Categories
                </button>
                <div className="absolute top-full left-0 w-48 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-xl rounded-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform translate-y-2 group-hover:translate-y-0">
                  {categories.map(cat => (
                    <Link key={cat.id} to={`/category/${cat.slug}`} className="block px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400">
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
              <Link to="/contact" className="text-sm font-medium hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Contact</Link>
              <Link to="/track-order" className="text-sm font-medium hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Track Order</Link>
            </div>

            {/* Search & Icons */}
            <div className="flex items-center gap-2 sm:gap-4">
              <form onSubmit={handleSearch} className="hidden md:flex items-center relative">
                <input 
                  type="text" 
                  placeholder="Search products..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-100 dark:bg-slate-800 border-none rounded-full py-2 pl-4 pr-10 text-sm text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 w-48 lg:w-64 transition-all"
                />
                <button type="submit" className="absolute right-3 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400">
                  <Search size={18} />
                </button>
              </form>

              <Link to="/wishlist" className="p-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 relative">
                <Heart size={22} />
                {wishlist.length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {wishlist.length}
                  </span>
                )}
              </Link>

              <Link to="/cart" className="p-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 relative">
                <ShoppingCart size={22} />
                {cart.length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {cart.reduce((acc, item) => acc + item.quantity, 0)}
                  </span>
                )}
              </Link>

              {isAdmin ? (
                <Link to="/admin" className="p-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-2 font-bold bg-indigo-50 dark:bg-indigo-900/30 rounded-lg px-3 transition-colors">
                  <Shield size={20} />
                  <span className="hidden sm:inline text-sm">Admin Panel</span>
                </Link>
              ) : user ? (
                <div className="relative group">
                  <button className="p-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400">
                    <User size={22} />
                  </button>
                  <div className="absolute top-full right-0 w-48 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-xl rounded-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700 mb-2">
                      <p className="text-sm font-bold truncate text-slate-900 dark:text-white">{user.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                    </div>
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 font-medium flex items-center gap-2">
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                </div>
              ) : (
                <Link to="/login" className="p-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400">
                  <User size={22} />
                </Link>
              )}

              <button onClick={() => setIsMenuOpen(true)} className="lg:hidden p-2 text-slate-600 dark:text-slate-300">
                <Menu size={24} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed right-0 top-0 bottom-0 w-80 bg-white dark:bg-slate-900 z-[70] shadow-2xl p-6 flex flex-col"
            >
              <div className="flex justify-between items-center mb-8">
                <span className="font-bold text-xl text-slate-900 dark:text-white">Menu</span>
                <button onClick={() => setIsMenuOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-900 dark:text-white">
                  <X size={24} />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <Link to="/" onClick={() => setIsMenuOpen(false)} className="text-lg font-medium py-2 border-b border-slate-50 dark:border-slate-800 text-slate-900 dark:text-white">Home</Link>
                <div className="py-2 border-b border-slate-50 dark:border-slate-800">
                  <span className="text-lg font-medium block mb-2 text-slate-900 dark:text-white">Categories</span>
                  <div className="grid grid-cols-2 gap-2">
                    {categories.map(cat => (
                      <Link key={cat.id} to={`/category/${cat.slug}`} onClick={() => setIsMenuOpen(false)} className="text-sm text-slate-600 dark:text-slate-400 py-1 hover:text-indigo-600 dark:hover:text-indigo-400">
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                </div>
                <Link to="/contact" onClick={() => setIsMenuOpen(false)} className="text-lg font-medium py-2 border-b border-slate-50 dark:border-slate-800 text-slate-900 dark:text-white">Contact</Link>
                <Link to="/track-order" onClick={() => setIsMenuOpen(false)} className="text-lg font-medium py-2 border-b border-slate-50 dark:border-slate-800 text-slate-900 dark:text-white">Track Order</Link>
              </div>

              <div className="mt-auto pt-8">
                <form onSubmit={handleSearch} className="relative mb-4">
                  <input 
                    type="text" 
                    placeholder="Search..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-3 pl-4 pr-10 text-sm text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400"
                  />
                  <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400">
                    <Search size={20} />
                  </button>
                </form>
                
                {isAdmin ? (
                  <Link to="/admin" className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-medium shadow-lg shadow-indigo-200 dark:shadow-none mb-3 transition-colors">
                    <Shield size={20} />
                    Admin Panel
                  </Link>
                ) : user ? (
                  <div className="mb-3">
                    <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl mb-2">
                      <p className="text-sm font-bold truncate text-slate-900 dark:text-white">{user.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                    </div>
                    <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-900/50 py-3 rounded-xl font-medium transition-colors">
                      <LogOut size={20} />
                      Logout
                    </button>
                  </div>
                ) : (
                  <Link to="/login" className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-medium shadow-lg shadow-indigo-200 dark:shadow-none transition-colors">
                    <User size={20} />
                    Login / Sign Up
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomeView siteAssets={siteAssets} categories={categories} />} />
          <Route path="/product/:id" element={<ProductDetailView />} />
          <Route path="/category/:slug" element={<CategoryView categories={categories} />} />
          <Route path="/cart" element={<CartView />} />
          <Route path="/wishlist" element={<WishlistView />} />
          <Route path="/track-order" element={<OrderTrackingView />} />
          <Route path="/contact" element={<ContactView />} />
          <Route path="/search" element={<CategoryView categories={categories} isSearch />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            <div>
              <Link to="/" className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                  <span className="font-bold text-xl">F</span>
                </div>
                <span className="font-bold text-xl tracking-tight">Firestation</span>
              </Link>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                {footerContent?.about || 'Your one-stop shop for everything you need. Quality products, fast shipping, and excellent customer service.'}
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-indigo-600 transition-colors">
                  <Facebook size={20} />
                </a>
                <a href="#" className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-indigo-600 transition-colors">
                  <Instagram size={20} />
                </a>
                <a href="#" className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-indigo-600 transition-colors">
                  <Twitter size={20} />
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-6">Quick Links</h4>
              <ul className="space-y-4">
                {footerContent?.links?.map((link: any, i: number) => (
                  <li key={i}>
                    <Link to={link.url} className="text-slate-400 hover:text-white transition-colors text-sm">{link.label}</Link>
                  </li>
                )) || (
                  <>
                    <li><Link to="/" className="text-slate-400 hover:text-white transition-colors text-sm">Home</Link></li>
                    <li><Link to="/shop" className="text-slate-400 hover:text-white transition-colors text-sm">Shop</Link></li>
                    <li><Link to="/contact" className="text-slate-400 hover:text-white transition-colors text-sm">Contact</Link></li>
                  </>
                )}
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-6">Categories</h4>
              <ul className="space-y-4">
                {categories.slice(0, 5).map(cat => (
                  <li key={cat.id}>
                    <Link to={`/category/${cat.slug}`} className="text-slate-400 hover:text-white transition-colors text-sm">{cat.name}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-6">Contact Us</h4>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-slate-400 text-sm">
                  <MapPin size={20} className="text-indigo-500 shrink-0" />
                  <span>123 Firestation Road, Newsagency City, 5678</span>
                </li>
                <li className="flex items-center gap-3 text-slate-400 text-sm">
                  <Phone size={20} className="text-indigo-500 shrink-0" />
                  <span>+1 (234) 567-890</span>
                </li>
                <li className="flex items-center gap-3 text-slate-400 text-sm">
                  <Mail size={20} className="text-indigo-500 shrink-0" />
                  <span>support@firestation.com</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 text-center text-slate-500 text-xs">
            <p>© {new Date().getFullYear()} Firestation Newsagency. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
