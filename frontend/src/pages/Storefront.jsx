import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, X, CreditCard, Shield, ArrowRight, Zap, Package, Star } from 'lucide-react';
import { useToast } from '../components/ToastProvider';
import CheckoutDrawer from '../components/CheckoutDrawer';

const PRODUCTS = [
  {
    id: 'prod_algo_001',
    name: 'Algorithmic Trading Starter Kit',
    price: 299.00,
    description: 'Automated execution strategies for low-latency markets. Includes backtesting framework, live connectors, and risk management primitives.',
    category: 'Trading Software',
    image: '/algo_trading.jpg',
    badge: 'Popular',
    features: ['Low-latency execution', 'Backtesting engine', 'Risk controls'],
  },
  {
    id: 'prod_evb_002',
    name: 'EventBridge Integration Blueprint',
    price: 149.00,
    description: 'Production AWS architecture template for event-driven systems. Pre-configured EventBridge rules, SQS consumers, and DLQ patterns.',
    category: 'Architecture Template',
    image: '/eventbridge.jpg',
    badge: null,
    features: ['AWS-native', 'Event routing', 'DLQ patterns'],
  },
  {
    id: 'prod_ldg_003',
    name: 'Distributed Ledger Core License',
    price: 499.00,
    description: 'GAAP-compliant double-entry accounting engine. Immutable audit trails, real-time balance verification, and multi-currency support.',
    category: 'Enterprise License',
    image: '/ledger_core.jpg',
    badge: 'Enterprise',
    features: ['Double-entry', 'GAAP compliant', 'Audit trails'],
  },
];

export default function Storefront({ apiBaseUrl = 'http://localhost:5000', cart = [], setCart, onOpenCheckout }) {
  const toast = useToast();
  const [hoveredProduct, setHoveredProduct] = useState(null);

  const addToCart = (product) => {
    if (!setCart) return;
    setCart((prev) => {
      const current = prev || [];
      const existing = current.find((item) => item.id === product.id);
      if (existing) {
        toast.success(`Updated quantity for ${product.name}`);
        return current.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      toast.success(`${product.name} added to cart`);
      return [...current, { ...product, quantity: 1 }];
    });
  };

  return (
    <div className="space-y-16 animate-fade-in">
      {/* Hero Section */}
      <section id="hero-section" className="relative overflow-hidden rounded-3xl">
        {/* Background orbs */}
        <div className="hero-orb w-[500px] h-[500px] bg-blue-600 -top-48 -left-24" />
        <div className="hero-orb w-[400px] h-[400px] bg-emerald-600 -bottom-32 -right-16" />
        <div className="hero-orb w-[300px] h-[300px] bg-violet-600 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        
        <div className="relative z-10 px-8 sm:px-12 lg:px-16 py-16 sm:py-20 lg:py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-6">
              <Zap className="w-3.5 h-3.5" />
              <span>Developer-First Commerce Platform</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6">
              <span className="text-gradient">Premium tools for</span>
              <br />
              <span className="text-gradient-brand">modern engineers</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-slate-400 leading-relaxed max-w-2xl mb-10">
              Algorithmic trading kits, cloud architecture blueprints, and enterprise accounting engines — built for teams that ship production software.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <a href="#product-grid" className="btn-primary flex items-center gap-2 text-sm">
                Browse Catalog
                <ArrowRight className="w-4 h-4" />
              </a>
              <div className="flex items-center gap-6 text-sm text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-emerald-500" />
                  <span>Idempotent Payments</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-blue-500" />
                  <span>Instant Delivery</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <section id="product-grid">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gradient">Core Products</h2>
            <p className="text-sm text-slate-500 mt-1">Enterprise-grade developer tools and licenses</p>
          </div>
          <span className="pill bg-slate-800/80 text-slate-400 border border-slate-700/50">
            {PRODUCTS.length} Products
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PRODUCTS.map((product, idx) => (
            <div
              key={product.id}
              id={`product-${product.id}`}
              className="product-card group"
              onMouseEnter={() => setHoveredProduct(product.id)}
              onMouseLeave={() => setHoveredProduct(null)}
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              {/* Product Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="product-image w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                
                {/* Badge */}
                {product.badge && (
                  <div className="absolute top-3 left-3">
                    <span className={`pill text-[11px] ${
                      product.badge === 'Popular'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      <Star className="w-3 h-3" />
                      {product.badge}
                    </span>
                  </div>
                )}

                {/* Category pill */}
                <div className="absolute bottom-3 left-3">
                  <span className="pill bg-slate-900/80 text-slate-300 text-[10px] backdrop-blur-sm border border-slate-700/50">
                    {product.category}
                  </span>
                </div>
              </div>

              {/* Product Info */}
              <div className="p-5 space-y-4">
                <div>
                  <h3 className="text-base font-semibold text-white group-hover:text-blue-300 transition-colors leading-tight">
                    {product.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed line-clamp-2">
                    {product.description}
                  </p>
                </div>

                {/* Feature tags */}
                <div className="flex flex-wrap gap-1.5">
                  {product.features.map((feat) => (
                    <span
                      key={feat}
                      className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-slate-800/80 text-slate-400 border border-slate-700/50"
                    >
                      {feat}
                    </span>
                  ))}
                </div>

                {/* Price + CTA */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                  <div>
                    <span className="text-xl font-bold text-white font-mono">
                      ${product.price.toFixed(2)}
                    </span>
                    <span className="text-xs text-slate-500 ml-1">USD</span>
                  </div>
                  <button
                    id={`add-to-cart-${product.id}`}
                    onClick={() => addToCart(product)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/20 hover:shadow-blue-500/30 active:scale-[0.96] transition-all duration-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Floating Cart Summary (visible when items in cart) */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-scale-in">
          <button
            id="floating-checkout-btn"
            onClick={onOpenCheckout}
            className="flex items-center gap-4 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-semibold shadow-2xl shadow-blue-600/30 hover:shadow-blue-500/40 active:scale-[0.98] transition-all duration-200 border border-white/10"
          >
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              <span className="text-sm">
                {cart.reduce((sum, i) => sum + i.quantity, 0)} items
              </span>
            </div>
            <div className="w-px h-5 bg-white/20" />
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold font-mono">
                ${cart.reduce((sum, i) => sum + i.price * i.quantity, 0).toFixed(2)}
              </span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}
    </div>
  );
}