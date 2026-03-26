import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  color?: string;
}

interface StoreContextType {
  cart: CartItem[];
  wishlist: string[];
  addToCart: (product: any, quantity?: number, color?: string) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  toggleWishlist: (productId: string) => void;
  clearCart: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);

  useEffect(() => {
    const savedCart = localStorage.getItem('store_cart');
    const savedWishlist = localStorage.getItem('store_wishlist');
    if (savedCart) setCart(JSON.parse(savedCart));
    if (savedWishlist) setWishlist(JSON.parse(savedWishlist));

    // Sync from backend if user is logged in
    if (user) {
      api.getCart(user.id).then(data => {
        if (data && Array.isArray(data)) {
          const backendCart = data.map((item: any) => ({
            id: item.product_id,
            name: item.products.name,
            price: item.products.price,
            quantity: item.quantity,
            image: JSON.parse(item.products.images || '[]')[0] || '',
            color: item.color
          }));
          setCart(backendCart);
        }
      }).catch(err => console.error("Failed to sync cart:", err));

      api.getWishlist(user.id).then(data => {
        if (data && Array.isArray(data)) {
          setWishlist(data.map((item: any) => item.product_id));
        }
      }).catch(err => console.error("Failed to sync wishlist:", err));
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('store_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('store_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const addToCart = (product: any, quantity = 1, color?: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id && item.color === color);
      let newCart;
      if (existing) {
        newCart = prev.map(item => 
          (item.id === product.id && item.color === color) 
            ? { ...item, quantity: item.quantity + quantity } 
            : item
        );
      } else {
        newCart = [...prev, { 
          id: product.id, 
          name: product.name, 
          price: product.price, 
          quantity, 
          image: JSON.parse(product.images || '[]')[0] || '',
          color 
        }];
      }
      
      if (user) {
        api.addToCart(user.id, product.id, existing ? existing.quantity + quantity : quantity, color)
          .catch(err => console.error("Failed to sync add to cart:", err));
      }
      
      return newCart;
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const newCart = prev.filter(item => item.id !== productId);
      if (user) {
        api.removeFromCart(user.id, productId).catch(err => console.error("Failed to sync remove from cart:", err));
      }
      return newCart;
    });
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    setCart(prev => {
      const newCart = prev.map(item => item.id === productId ? { ...item, quantity } : item);
      if (user) {
        api.updateCartItem(user.id, productId, quantity).catch(err => console.error("Failed to sync update cart:", err));
      }
      return newCart;
    });
  };

  const toggleWishlist = (productId: string) => {
    setWishlist(prev => {
      const isIncluded = prev.includes(productId);
      const newWishlist = isIncluded 
        ? prev.filter(id => id !== productId) 
        : [...prev, productId];
      
      if (user) {
        if (isIncluded) {
          api.removeFromWishlist(user.id, productId).catch(err => console.error("Failed to sync remove from wishlist:", err));
        } else {
          api.addToWishlist(user.id, productId).catch(err => console.error("Failed to sync add to wishlist:", err));
        }
      }
      
      return newWishlist;
    });
  };

  const clearCart = () => setCart([]);

  return (
    <StoreContext.Provider value={{ 
      cart, 
      wishlist, 
      addToCart, 
      removeFromCart, 
      updateCartQuantity, 
      toggleWishlist,
      clearCart
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within a StoreProvider');
  return context;
};
