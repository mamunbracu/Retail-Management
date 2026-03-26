import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { ShoppingCart, Heart, Star, Filter, SlidersHorizontal, Search, X, ChevronDown } from 'lucide-react';
import { useStore } from '../StoreContext';
import { cn } from '../../utils';

interface CategoryViewProps {
  categories: any[];
  isSearch?: boolean;
}

export const CategoryView: React.FC<CategoryViewProps> = ({ categories, isSearch }) => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q');
  
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [sortBy, setSortBy] = useState('newest');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const category = categories.find(c => c.slug === slug);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let url = '/api/ecommerce/products';
        if (isSearch && query) {
          url += `?search=${encodeURIComponent(query)}`;
        } else if (category) {
          url += `?categoryId=${category.id}`;
        }
        
        const res = await fetch(url);
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [slug, query, isSearch, category]);

  const filteredProducts = products.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    if (sortBy === 'rating') return 5 - 5; // Placeholder
    return 0; // newest
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col lg:flex-row gap-12">
        {/* Sidebar Filters */}
        <aside className={cn(
          "lg:w-64 space-y-8 shrink-0",
          "fixed inset-0 z-[60] bg-white p-8 lg:static lg:bg-transparent lg:p-0 transition-transform lg:translate-x-0",
          isFilterOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        )}>
          <div className="flex justify-between items-center lg:hidden mb-8">
            <h3 className="font-bold text-xl">Filters</h3>
            <button onClick={() => setIsFilterOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
              <X size={24} />
            </button>
          </div>

          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider mb-6">Categories</h4>
            <div className="space-y-3">
              {categories.map(cat => (
                <Link 
                  key={cat.id} 
                  to={`/category/${cat.slug}`}
                  onClick={() => setIsFilterOpen(false)}
                  className={cn(
                    "block text-sm transition-colors",
                    slug === cat.slug ? "text-indigo-600 font-bold" : "text-slate-500 hover:text-indigo-600"
                  )}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider mb-6">Price Range</h4>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <input 
                  type="number" 
                  value={priceRange[0]} 
                  onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                  className="w-full bg-slate-100 border-none rounded-lg py-2 px-3 text-sm"
                  placeholder="Min"
                />
                <span className="text-slate-400">-</span>
                <input 
                  type="number" 
                  value={priceRange[1]} 
                  onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                  className="w-full bg-slate-100 border-none rounded-lg py-2 px-3 text-sm"
                  placeholder="Max"
                />
              </div>
              <input 
                type="range" 
                min="0" 
                max="1000" 
                value={priceRange[1]} 
                onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
          </div>

          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider mb-6">Rating</h4>
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map(rating => (
                <button key={rating} className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 transition-colors">
                  <div className="flex gap-1 text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={14} fill={i < rating ? "currentColor" : "none"} />
                    ))}
                  </div>
                  <span>& Up</span>
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={() => {
              setPriceRange([0, 1000]);
              setIsFilterOpen(false);
            }}
            className="w-full py-3 border-2 border-slate-100 hover:border-indigo-600 hover:text-indigo-600 rounded-xl text-sm font-bold transition-all"
          >
            Reset Filters
          </button>
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-12">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {isSearch ? `Search Results for "${query}"` : category?.name || 'All Products'}
              </h1>
              <p className="text-slate-500 text-sm">Showing {sortedProducts.length} products</p>
            </div>

            <div className="flex items-center gap-4 w-full sm:w-auto">
              <button 
                onClick={() => setIsFilterOpen(true)}
                className="lg:hidden flex-1 flex items-center justify-center gap-2 bg-slate-100 py-3 px-6 rounded-xl font-bold text-sm"
              >
                <Filter size={18} />
                Filters
              </button>
              <div className="relative flex-1 sm:flex-none">
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full appearance-none bg-slate-100 border-none rounded-xl py-3 pl-6 pr-12 font-bold text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                </select>
                <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-slate-50 aspect-square rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : sortedProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {sortedProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="py-24 text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
                <Search size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">No products found</h3>
              <p className="text-slate-500 mb-8">Try adjusting your filters or search query.</p>
              <Link to="/" className="inline-flex bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold">
                Continue Shopping
              </Link>
            </div>
          )}
        </div>
      </div>
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
