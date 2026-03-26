import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, ArrowLeft, Star } from 'lucide-react';
import { useStore } from '../StoreContext';
import { cn } from '../../utils';
import { motion, AnimatePresence } from 'motion/react';

export const WishlistView: React.FC = () => {
  const { wishlist, toggleWishlist, addToCart } = useStore();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWishlistProducts = async () => {
      if (wishlist.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        // In a real app, you'd have an endpoint to fetch multiple products by IDs
        const promises = wishlist.map(id => fetch(`/api/ecommerce/products/${id}`).then(res => res.json()));
        const data = await Promise.all(promises);
        setProducts(data);
      } catch (error) {
        console.error('Failed to fetch wishlist products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchWishlistProducts();
  }, [wishlist]);

  if (wishlist.length === 0) return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
      <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-400">
        <Heart size={40} />
      </div>
      <h2 className="text-3xl font-bold mb-4">Your wishlist is empty</h2>
      <p className="text-slate-500 mb-12 max-w-md mx-auto">Save items you love to your wishlist and they'll appear here. Start exploring our collection today!</p>
      <Link to="/" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all">
        <ArrowLeft size={20} />
        Start Exploring
      </Link>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-12">My Wishlist</h1>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-slate-50 aspect-square rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <AnimatePresence mode="popLayout">
            {products.map((product) => (
              <motion.div 
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group bg-white rounded-3xl overflow-hidden border border-slate-100 hover:shadow-2xl hover:shadow-slate-200 transition-all duration-300 flex flex-col"
              >
                <div className="relative aspect-square overflow-hidden bg-slate-50">
                  <Link to={`/product/${product.id}`}>
                    <img 
                      src={JSON.parse(product.images || '[]')[0] || 'https://picsum.photos/seed/product/400/400'} 
                      alt={product.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                  </Link>
                  <button 
                    onClick={() => toggleWishlist(product.id)}
                    className="absolute top-4 right-4 p-2 bg-rose-500 text-white rounded-full shadow-lg transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <Link to={`/product/${product.id}`} className="font-bold text-slate-900 hover:text-indigo-600 transition-colors line-clamp-1 mb-2">
                    {product.name}
                  </Link>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-lg font-bold text-indigo-600">${product.price}</span>
                    <button 
                      onClick={() => addToCart(product)}
                      className="p-3 bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-600 rounded-xl transition-all"
                    >
                      <ShoppingCart size={20} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
