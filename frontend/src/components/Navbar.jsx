import React from 'react';
import { ShoppingBag, BookOpen, BarChart3, User, ShoppingCart } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, cartCount = 0, onOpenCheckout }) {
  const navItems = [
    { id: 'store', label: 'Store', icon: ShoppingBag },
    { id: 'orders', label: 'Orders', icon: BookOpen },
    { id: 'ledger', label: 'Ledger', icon: BarChart3 },
    { id: 'account', label: 'Account', icon: User },
  ];

  return (
    <header id="main-header" className="sticky top-0 z-50 border-b border-slate-800/80" style={{ background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setActiveTab('store')}
            id="brand-logo"
          >
            <div className="relative w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-emerald-500 opacity-20 group-hover:opacity-30 transition-opacity" />
              <div className="absolute inset-[1px] bg-[#0f172a] rounded-[10px] flex items-center justify-center">
                <svg width="22" height="22" viewBox="0 0 100 100" fill="none">
                  <path d="M30 70 L50 30 L70 70" stroke="url(#navGrad)" strokeWidth="10" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="50" cy="55" r="5" fill="#10b981"/>
                  <defs>
                    <linearGradient id="navGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6"/>
                      <stop offset="100%" stopColor="#10b981"/>
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
            <div>
              <span className="font-bold text-[15px] tracking-tight text-gradient">
                FinCommerce
              </span>
              <p className="text-[10px] text-slate-500 font-medium -mt-0.5">
                Developer Commerce
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1" id="main-nav">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`nav-link ${isActive ? 'nav-link-active' : 'nav-link-inactive'}`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Cart Badge */}
          <button
            id="cart-toggle"
            onClick={onOpenCheckout}
            className="relative p-2.5 rounded-xl hover:bg-slate-800/60 transition-colors group"
            aria-label="Shopping Cart"
          >
            <ShoppingCart className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-blue-500 text-white text-[10px] font-bold shadow-lg shadow-blue-500/30 animate-scale-in">
                {cartCount}
              </span>
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex overflow-x-auto py-2 gap-1.5 border-t border-slate-800/50 -mx-4 px-4 scrollbar-hide">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
