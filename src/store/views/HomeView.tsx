import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Heart, ChevronRight, Star, ArrowRight, Zap, ShieldCheck, Truck } from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '../StoreContext';
import { cn } from '../../utils';

interface HomeViewProps {
  siteAssets: any[];
  categories: any[];
}

export const HomeView: React.FC<HomeViewProps> = ({ siteAssets, categories }) => {
  const { addToCart, toggleWishlist, wishlist } = useStore();
  const [products, setProducts] = useState<any[]>([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  const banners = siteAssets.filter(a => a.type === 'banner').map(a => JSON.parse(a.content));
  const ads = siteAssets.filter(a => a.type === 'ad').map(a => JSON.parse(a.content));

  useEffect(() => {
    fetch('/api/ecommerce/products?limit=8')
      .then(res => res.json())
      .then(data => setProducts(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex(prev => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  return (
    <div className="pb-16">
      {/* Hero Banner Carousel */}
      <section className="relative h-[400px] lg:h-[600px] overflow-hidden bg-slate-100">
        {banners.map((banner, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: index === currentBannerIndex ? 1 : 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0"
          >
            <img 
              src={banner.image} 
              alt={banner.title} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: index === currentBannerIndex ? 1 : 0 }}
                  transition={{ delay: 0.3 }}
                  className="max-w-xl text-white"
                >
                  <h1 className="text-4xl lg:text-7xl font-bold mb-4 leading-tight">{banner.title}</h1>
                  <p className="text-lg lg:text-xl mb-8 text-white/80">{banner.subtitle}</p>
                  <Link 
                    to={banner.link || '/shop'} 
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-xl shadow-indigo-500/20"
                  >
                    Shop Now
                    <ArrowRight size={20} />
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.div>
        ))}
        
        {/* Carousel Indicators */}
        {banners.length > 1 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {banners.map((_, i) => (
              <button 
                key={i}
                onClick={() => setCurrentBannerIndex(i)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  i === currentBannerIndex ? "bg-white w-8" : "bg-white/40"
                )}
              />
            ))}
          </div>
        )}
      </section>

      {/* Features */}
      <section className="py-12 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-2xl">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                <Truck size={24} />
              </div>
              <div>
                <h4 className="font-bold text-sm">Free Shipping</h4>
                <p className="text-xs text-slate-500">On all orders over $50</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-2xl">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h4 className="font-bold text-sm">Secure Payment</h4>
                <p className="text-xs text-slate-500">100% secure payment processing</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-2xl">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                <Zap size={24} />
              </div>
              <div>
                <h4 className="font-bold text-sm">Fast Delivery</h4>
                <p className="text-xs text-slate-500">Get your items in 2-3 days</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold mb-2">Shop by Category</h2>
              <p className="text-slate-500">Explore our wide range of products across different categories.</p>
            </div>
            <Link to="/shop" className="text-indigo-600 font-bold flex items-center gap-1 hover:gap-2 transition-all">
              View All <ChevronRight size={20} />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map(cat => (
              <Link 
                key={cat.id} 
                to={`/category/${cat.slug}`}
                className="group relative h-64 overflow-hidden rounded-3xl bg-slate-100"
              >
                <img 
                  src={cat.thumbnail} 
                  alt={cat.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-6">
                  <div className="text-white">
                    <h3 className="font-bold text-xl mb-1">{cat.name}</h3>
                    <span className="text-xs text-white/60 group-hover:text-white transition-colors">Explore Collection</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Ads Section */}
      {ads.length > 0 && (
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {ads.slice(0, 2).map((ad, i) => (
                <Link 
                  key={i} 
                  to={ad.link || '#'} 
                  className="relative h-48 lg:h-64 rounded-3xl overflow-hidden group"
                >
                  <img 
                    src={ad.image} 
                    alt={ad.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center p-8">
                    <div className="text-white">
                      <h3 className="text-2xl font-bold mb-2">{ad.title}</h3>
                      <p className="text-white/80 mb-4">{ad.subtitle}</p>
                      <span className="inline-block bg-white text-slate-900 px-4 py-2 rounded-lg text-sm font-bold">Learn More</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* New Arrivals */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold mb-2">New Arrivals</h2>
              <p className="text-slate-500">Be the first to get our latest and greatest products.</p>
            </div>
            <div className="flex gap-2">
              {/* Add carousel controls if needed */}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

const ProductCard = ({ product }: { product: any }) => {
  const { addToCart, toggleWishlist, wishlist } = useStore();
  const isWishlisted = wishlist.includes(product.id);
  
  let images = [];
  try {
    images = Array.isArray(product.images) ? product.images : JSON.parse(product.images || '[]');
  } catch (e) {
    console.error("Failed to parse images:", e);
  }

  return (
    <div className="group bg-white rounded-3xl overflow-hidden border border-slate-100 hover:shadow-2xl hover:shadow-slate-200 transition-all duration-300 flex flex-col">
      <div className="relative aspect-square overflow-hidden bg-slate-50">
        <Link to={`/product/${product.id}`}>
          <img 
            src={images[0] || 'https://picsum.photos/seed/product/400/400'} 
            alt={product.name} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            referrerPolicy="no-referrer"
          />
        </Link>
        <button 
          onClick={() => toggleWishlist(product.id)}
          className={cn(
            "absolute top-4 right-4 p-2 rounded-full shadow-lg transition-all",
            isWishlisted ? "bg-rose-500 text-white" : "bg-white text-slate-400 hover:text-rose-500"
          )}
        >
          <Heart size={18} fill={isWishlisted ? "currentColor" : "none"} />
        </button>
        {product.stock_quantity < 10 && (
          <span className="absolute top-4 left-4 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
            Low Stock
          </span>
        )}
      </div>
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <Link to={`/product/${product.id}`} className="font-bold text-slate-900 hover:text-indigo-600 transition-colors line-clamp-1">
            {product.name}
          </Link>
          <div className="flex items-center gap-1 text-amber-500">
            <Star size={14} fill="currentColor" />
            <span className="text-xs font-bold">4.8</span>
          </div>
        </div>
        <p className="text-slate-500 text-xs mb-4 line-clamp-2 flex-1">{product.description}</p>
        <div className="flex items-center justify-between mt-auto">
          <span className="text-xl font-bold text-indigo-600">${product.price}</span>
          <button 
            onClick={() => addToCart(product)}
            className="p-3 bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-600 rounded-xl transition-all"
          >
            <ShoppingCart size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
