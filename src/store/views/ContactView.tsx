import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare, Clock, Globe, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';

export const ContactView: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch('/api/ecommerce/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        toast.success('Message sent successfully! We will get back to you soon.');
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        toast.error('Failed to send message.');
      }
    } catch (error) {
      console.error('Contact error:', error);
      toast.error('An error occurred while sending your message.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-24">
      <div className="text-center mb-16 lg:mb-24">
        <h1 className="text-4xl lg:text-6xl font-bold mb-6 tracking-tight">Get in Touch</h1>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto">Have a question or need assistance? Our team is here to help you with anything you need.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
        {/* Contact Info */}
        <div className="space-y-8">
          <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-2xl shadow-indigo-200">
            <h3 className="text-2xl font-bold mb-8">Contact Information</h3>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                  <Phone size={24} />
                </div>
                <div>
                  <p className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-1">Call Us</p>
                  <p className="font-bold text-lg">+1 (234) 567-890</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                  <Mail size={24} />
                </div>
                <div>
                  <p className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-1">Email Us</p>
                  <p className="font-bold text-lg">support@firestation.com</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                  <MapPin size={24} />
                </div>
                <div>
                  <p className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-1">Visit Us</p>
                  <p className="font-bold text-lg">123 Firestation Road, Newsagency City, 5678</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100">
            <h4 className="font-bold text-lg mb-6 flex items-center gap-2">
              <Clock size={20} className="text-indigo-600" />
              Business Hours
            </h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Monday - Friday</span>
                <span className="font-bold text-slate-900">9:00 AM - 6:00 PM</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Saturday</span>
                <span className="font-bold text-slate-900">10:00 AM - 4:00 PM</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Sunday</span>
                <span className="font-bold text-rose-500 uppercase tracking-wider">Closed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-xl shadow-slate-100 border border-slate-100">
            <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
              <MessageSquare size={24} className="text-indigo-600" />
              Send us a Message
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Full Name</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Email Address</label>
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="john@example.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Subject</label>
                <input 
                  type="text" 
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder="How can we help?"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Message</label>
                <textarea 
                  required
                  rows={6}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                  placeholder="Your message here..."
                />
              </div>
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white py-5 rounded-2xl font-bold text-lg shadow-2xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-3"
              >
                {loading ? 'Sending...' : (
                  <>
                    Send Message
                    <Send size={20} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
