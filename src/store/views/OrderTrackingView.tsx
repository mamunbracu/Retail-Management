import React, { useState } from 'react';
import { Search, Package, Truck, CheckCircle, Clock, ArrowRight, MapPin, Calendar } from 'lucide-react';
import { cn } from '../../utils';
import { motion, AnimatePresence } from 'motion/react';

export const OrderTrackingView: React.FC = () => {
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) return;
    
    setLoading(true);
    setError('');
    setOrder(null);
    
    try {
      // In a real app, you'd fetch by order ID
      const res = await fetch(`/api/ecommerce/orders/user/guest-user`);
      const data = await res.json();
      const foundOrder = data.find((o: any) => o.id === orderId || o.id.startsWith(orderId));
      
      if (foundOrder) {
        setOrder(foundOrder);
      } else {
        setError('Order not found. Please check your order ID.');
      }
    } catch (error) {
      console.error('Tracking error:', error);
      setError('An error occurred while tracking your order.');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { label: 'Order Placed', icon: Clock, status: 'Completed' },
    { label: 'Processing', icon: Package, status: 'Completed' },
    { label: 'Shipped', icon: Truck, status: 'In Progress' },
    { label: 'Delivered', icon: CheckCircle, status: 'Pending' }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-4">Track Your Order</h1>
        <p className="text-slate-500">Enter your order ID to see the real-time status of your delivery.</p>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-100 border border-slate-100 mb-12">
        <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <input 
              type="text" 
              placeholder="Enter Order ID (e.g., 123456)" 
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white px-10 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2"
          >
            {loading ? 'Tracking...' : (
              <>
                Track Order
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>
        {error && <p className="text-rose-500 text-sm mt-4 font-medium">{error}</p>}
      </div>

      <AnimatePresence>
        {order && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Order Status Header */}
            <div className="bg-indigo-600 rounded-3xl p-8 text-white flex flex-col sm:flex-row justify-between items-center gap-6">
              <div>
                <p className="text-indigo-200 text-sm mb-1">Order ID: #{order.id.slice(0, 8)}</p>
                <h2 className="text-2xl font-bold">Estimated Delivery: Oct 25, 2026</h2>
              </div>
              <div className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-2xl font-bold">
                Status: {order.status}
              </div>
            </div>

            {/* Tracking Steps */}
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-lg shadow-slate-50">
              <div className="relative flex flex-col sm:flex-row justify-between gap-8">
                {/* Connector Line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-100 sm:left-0 sm:right-0 sm:top-6 sm:h-0.5 sm:w-full -z-10" />
                
                {steps.map((step, i) => (
                  <div key={i} className="flex sm:flex-col items-center gap-4 sm:gap-3 text-center">
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg",
                      step.status === 'Completed' ? "bg-indigo-600 text-white" : 
                      step.status === 'In Progress' ? "bg-amber-500 text-white animate-pulse" : 
                      "bg-white text-slate-300 border-2 border-slate-100"
                    )}>
                      <step.icon size={24} />
                    </div>
                    <div>
                      <h4 className={cn(
                        "font-bold text-sm",
                        step.status === 'Pending' ? "text-slate-400" : "text-slate-900"
                      )}>{step.label}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{step.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-lg shadow-slate-50">
                <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                  <Package size={20} className="text-indigo-600" />
                  Order Items
                </h3>
                <div className="space-y-4">
                  {JSON.parse(order.items || '[]').map((item: any, i: number) => (
                    <div key={i} className="flex justify-between items-center py-3 border-b border-slate-50 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-slate-50 rounded-lg overflow-hidden border border-slate-100">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-900">{item.name}</p>
                          <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <span className="font-bold text-slate-900 text-sm">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="pt-4 flex justify-between items-center font-bold text-lg">
                    <span>Total</span>
                    <span className="text-indigo-600">${order.total_price.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-lg shadow-slate-50">
                <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                  <MapPin size={20} className="text-indigo-600" />
                  Delivery Info
                </h3>
                <div className="space-y-6">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Customer</p>
                    <p className="font-bold text-slate-900">{JSON.parse(order.user_info || '{}').name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Shipping Address</p>
                    <p className="text-slate-600 text-sm">{JSON.parse(order.user_info || '{}').address}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Order Date</p>
                    <div className="flex items-center gap-2 text-slate-600 text-sm">
                      <Calendar size={16} />
                      {new Date(order.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
