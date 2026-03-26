import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, Heart, Star, ChevronLeft, ChevronRight, Truck, ShieldCheck, Zap, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../StoreContext';
import { cn } from '../../utils';

export const ProductDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { addToCart, toggleWishlist, wishlist } = useStore();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [suggestedProducts, setSuggestedProducts] = useState<any[]>([]);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/ecommerce/products/${id}`);
        const data = await res.json();
        setProduct(data);
        
        const colors = JSON.parse(data.colors || '[]');
        if (colors.length > 0) setSelectedColor(colors[0]);

        // Fetch suggested products
        const suggestedRes = await fetch(`/api/ecommerce/products?categoryId=${data.category_id}&limit=4`);
        const suggestedData = await suggestedRes.json();
        setSuggestedProducts(suggestedData.filter((p: any) => p.id !== id));
      } catch (error) {
        console.error('Failed to fetch product:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!product) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <h2 className="text-2xl font-bold">Product not found</h2>
      <Link to="/" className="text-indigo-600 font-bold hover:underline">Back to Home</Link>
    </div>
  );

  const images = JSON.parse(product.images || '[]');
  const colors = JSON.parse(product.colors || '[]');
  const isWishlisted = wishlist.includes(product.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-8 transition-colors">
        <ArrowLeft size={20} />
        Back to Products
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-24">
        {/* Image Gallery */}
        <div className="space-y-6">
          <div className="aspect-square rounded-3xl overflow-hidden bg-slate-50 border border-slate-100 relative">
            <AnimatePresence mode="wait">
              <motion.img 
                key={activeImageIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                src={images[activeImageIndex] || 'https://picsum.photos/seed/product/800/800'} 
                alt={product.name} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </AnimatePresence>
            <button 
              onClick={() => toggleWishlist(product.id)}
              className={cn(
                "absolute top-6 right-6 p-3 rounded-full shadow-xl transition-all",
                isWishlisted ? "bg-rose-500 text-white" : "bg-white text-slate-400 hover:text-rose-500"
              )}
            >
              <Heart size={24} fill={isWishlisted ? "currentColor" : "none"} />
            </button>
          </div>
          
          {images.length > 1 && (
            <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
              {images.map((img: string, i: number) => (
                <button 
                  key={i}
                  onClick={() => setActiveImageIndex(i)}
                  className={cn(
                    "w-24 h-24 rounded-2xl overflow-hidden border-2 transition-all shrink-0",
                    activeImageIndex === i ? "border-indigo-600 scale-105 shadow-lg" : "border-transparent opacity-60 hover:opacity-100"
                  )}
                >
                  <img src={img} alt={`${product.name} ${i}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          <div className="mb-8">
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm mb-4 uppercase tracking-widest">
              <span>{product.categories?.name}</span>
              <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
              <div className="flex items-center gap-1 text-amber-500">
                <Star size={14} fill="currentColor" />
                <span>4.9 (128 reviews)</span>
              </div>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold mb-4 leading-tight">{product.name}</h1>
            <div className="flex items-center gap-4">
              <span className="text-3xl font-bold text-indigo-600">${product.price}</span>
              {product.stock > 0 ? (
                <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">In Stock</span>
              ) : (
                <span className="bg-rose-100 text-rose-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Out of Stock</span>
              )}
            </div>
          </div>

          <p className="text-slate-600 leading-relaxed mb-8 text-lg">{product.description}</p>

          <div className="space-y-8 mb-12">
            {colors.length > 0 && (
              <div>
                <span className="block text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">Select Color</span>
                <div className="flex gap-3">
                  {colors.map((color: string) => (
                    <button 
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={cn(
                        "px-6 py-3 rounded-xl border-2 font-medium transition-all",
                        selectedColor === color ? "border-indigo-600 bg-indigo-50 text-indigo-600 shadow-md" : "border-slate-100 hover:border-slate-300"
                      )}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <span className="block text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">Quantity</span>
              <div className="flex items-center gap-4">
                <div className="flex items-center bg-slate-100 rounded-xl p-1">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-lg transition-colors text-xl font-bold"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-bold">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-lg transition-colors text-xl font-bold"
                  >
                    +
                  </button>
                </div>
                <span className="text-slate-400 text-sm">{product.stock} items available</span>
              </div>
            </div>
          </div>

          <div className="flex gap-4 mb-12">
            <button 
              onClick={() => addToCart(product, quantity, selectedColor || undefined)}
              disabled={product.stock === 0}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white py-5 rounded-2xl font-bold text-lg shadow-2xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-3"
            >
              <ShoppingCart size={24} />
              Add to Cart
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-12 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                <Truck size={20} />
              </div>
              <span className="text-xs font-bold text-slate-600">Free Delivery</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                <ShieldCheck size={20} />
              </div>
              <span className="text-xs font-bold text-slate-600">2 Year Warranty</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                <Zap size={20} />
              </div>
              <span className="text-xs font-bold text-slate-600">Secure Payment</span>
            </div>
          </div>
        </div>
      </div>

      {/* Product Details Tabs */}
      <div className="mb-24">
        <div className="flex border-b border-slate-100 mb-8">
          <button className="px-8 py-4 border-b-2 border-indigo-600 text-indigo-600 font-bold">Product Details</button>
          <button className="px-8 py-4 text-slate-400 hover:text-slate-600 font-bold">Reviews (128)</button>
          <button className="px-8 py-4 text-slate-400 hover:text-slate-600 font-bold">Shipping & Returns</button>
        </div>
        <div className="bg-slate-50 rounded-3xl p-8 lg:p-12">
          <p className="text-slate-600 leading-relaxed whitespace-pre-line">{product.details}</p>
        </div>
      </div>

      {/* Suggested Products */}
      {suggestedProducts.length > 0 && (
        <section>
          <h2 className="text-3xl font-bold mb-12">Suggested Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {suggestedProducts.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

const ProductCard = ({ product }: { product: any }) => {
  const { addToCart, toggleWishlist, wishlist } = useStore();
  const isWishlisted = wishlist.includes(product.id);
  const images = JSON.parse(product.images || '[]');

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
    </div>
  );
};
