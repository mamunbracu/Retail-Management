import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Trash2, ArrowLeft, ArrowRight, Truck, ShieldCheck, Zap, CreditCard } from 'lucide-react';
import { useStore } from '../StoreContext';
import { cn } from '../../utils';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

export const CartView: React.FC = () => {
  const { cart, removeFromCart, updateCartQuantity, clearCart } = useStore();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    address: '',
    phone: ''
  });

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shipping = subtotal > 50 ? 0 : 10;
  const total = subtotal + shipping;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    
    try {
      const res = await fetch('/api/ecommerce/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'guest-user', // In a real app, use auth.currentUser.uid
          items: cart,
          totalPrice: total,
          userInfo
        })
      });
      
      if (res.ok) {
        toast.success('Order placed successfully!');
        clearCart();
        setIsCheckingOut(false);
      } else {
        toast.error('Failed to place order.');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('An error occurred during checkout.');
    }
  };

  if (cart.length === 0 && !isCheckingOut) return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
      <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-400">
        <ShoppingCart size={40} />
      </div>
      <h2 className="text-3xl font-bold mb-4">Your cart is empty</h2>
      <p className="text-slate-500 mb-12 max-w-md mx-auto">Looks like you haven't added anything to your cart yet. Explore our products and find something you love!</p>
      <Link to="/" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all">
        <ArrowLeft size={20} />
        Start Shopping
      </Link>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-12">Your Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence mode="popLayout">
            {cart.map((item) => (
              <motion.div 
                key={`${item.id}-${item.color}`}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex gap-6 p-6 bg-white rounded-3xl border border-slate-100 items-center"
              >
                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-slate-50 rounded-2xl overflow-hidden shrink-0 border border-slate-50">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-slate-900 truncate">{item.name}</h3>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  {item.color && <p className="text-sm text-slate-500 mb-4">Color: <span className="text-slate-900 font-medium">{item.color}</span></p>}
                  <div className="flex justify-between items-center mt-auto">
                    <div className="flex items-center bg-slate-100 rounded-xl p-1">
                      <button 
                        onClick={() => updateCartQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg transition-colors font-bold"
                      >
                        -
                      </button>
                      <span className="w-10 text-center font-bold text-sm">{item.quantity}</span>
                      <button 
                        onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg transition-colors font-bold"
                      >
                        +
                      </button>
                    </div>
                    <span className="font-bold text-indigo-600 text-lg">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <Link to="/" className="inline-flex items-center gap-2 text-indigo-600 font-bold hover:underline py-4">
            <ArrowLeft size={20} />
            Continue Shopping
          </Link>
        </div>

        {/* Order Summary */}
        <div className="space-y-8">
          <div className="bg-slate-900 text-white rounded-3xl p-8 shadow-2xl shadow-slate-200">
            <h3 className="text-xl font-bold mb-8">Order Summary</h3>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span className="text-white font-bold">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Shipping</span>
                <span className="text-white font-bold">{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
              </div>
              <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
                <span className="text-lg font-bold">Total</span>
                <span className="text-2xl font-bold text-indigo-400">${total.toFixed(2)}</span>
              </div>
            </div>

            {!isCheckingOut ? (
              <button 
                onClick={() => setIsCheckingOut(true)}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-2xl font-bold text-lg transition-all shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2"
              >
                Checkout
                <ArrowRight size={20} />
              </button>
            ) : (
              <form onSubmit={handleCheckout} className="space-y-4">
                <div className="space-y-3">
                  <input 
                    type="text" 
                    placeholder="Full Name" 
                    required
                    value={userInfo.name}
                    onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
                    className="w-full bg-slate-800 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                  <input 
                    type="email" 
                    placeholder="Email Address" 
                    required
                    value={userInfo.email}
                    onChange={(e) => setUserInfo({ ...userInfo, email: e.target.value })}
                    className="w-full bg-slate-800 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                  <input 
                    type="text" 
                    placeholder="Shipping Address" 
                    required
                    value={userInfo.address}
                    onChange={(e) => setUserInfo({ ...userInfo, address: e.target.value })}
                    className="w-full bg-slate-800 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                  <input 
                    type="tel" 
                    placeholder="Phone Number" 
                    required
                    value={userInfo.phone}
                    onChange={(e) => setUserInfo({ ...userInfo, phone: e.target.value })}
                    className="w-full bg-slate-800 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsCheckingOut(false)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-4 rounded-2xl font-bold text-sm transition-all"
                  >
                    Back
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-2xl font-bold text-sm transition-all shadow-xl shadow-indigo-500/20"
                  >
                    Place Order
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="bg-slate-50 rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-slate-600">
              <ShieldCheck size={20} className="text-indigo-600" />
              <span className="text-xs font-bold">Secure Checkout</span>
            </div>
            <div className="flex items-center gap-3 text-slate-600">
              <Truck size={20} className="text-indigo-600" />
              <span className="text-xs font-bold">Fast & Reliable Shipping</span>
            </div>
            <div className="flex items-center gap-3 text-slate-600">
              <CreditCard size={20} className="text-indigo-600" />
              <span className="text-xs font-bold">Multiple Payment Options</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
