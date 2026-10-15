import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Cpu, Terminal, Check, ShoppingBag, Plus } from 'lucide-react';
import { PRODUCTS, CATEGORIES, formatINR } from '../data/products';
import { useCart } from '../context/CartContext';
import { useToast } from '../components/ToastProvider';

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get('category') || 'all';
  const { addToCart } = useCart();
  const toast = useToast();

  const handleAddToCart = (product, e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    toast.success(`Added ${product.name} to cart`);
  };

  const filteredProducts = PRODUCTS.filter((p) => {
    if (activeCategory === 'all') return true;
    return p.category === activeCategory;
  });

  return (
    <div className="space-y-16 sm:space-y-24">
      {/* Editorial Hardware Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-surface border border-border p-8 sm:p-12 lg:p-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-elevated border border-border text-secondary text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-accent" />
              <span>Reliable Commerce Platform</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-primary leading-[1.15]">
              Hardware, without the friction.
            </h1>

            <p className="text-secondary text-base sm:text-lg max-w-xl leading-relaxed">
              Shop performance laptops, audio gear, and components through a commerce platform built around reliable transactions.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="#catalog"
                className="btn-primary"
              >
                <span>Explore hardware</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <Link
                to="/console/aws-architecture"
                className="btn-secondary"
              >
                <Terminal className="w-4 h-4 text-accent" />
                <span>Explore the infrastructure</span>
              </Link>
            </div>

            {/* Subtle trust metrics */}
            <div className="pt-6 border-t border-border/80 flex flex-wrap items-center gap-6 text-xs text-secondary font-mono">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-success" />
                <span>Deterministic Idempotency</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-accent" />
                <span>Double-Entry Balanced</span>
              </div>
            </div>
          </div>

          {/* Right Hero Hardware Visual */}
          <div className="lg:col-span-5 relative">
            <div className="relative aspect-square rounded-xl overflow-hidden bg-surface-elevated border border-border group">
              <img
                src="/products/asus_g14.jpg"
                alt="ASUS ROG Zephyrus G14 performance laptop"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent opacity-60" />
              <div className="absolute bottom-4 left-4 right-4 p-3 rounded-lg bg-surface/90 backdrop-blur-sm border border-border flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-mono text-accent">FEATURED HARVEST</span>
                  <h3 className="text-xs font-semibold text-primary">ASUS ROG Zephyrus G14</h3>
                </div>
                <span className="font-mono text-sm font-bold text-primary">
                  {formatINR(174999)}
                </span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Product Catalog Section */}
      <section id="catalog" className="space-y-8 scroll-mt-24">
        {/* Section Header & Category Pills */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-border">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-primary">Electronic Hardware</h2>
            <p className="text-xs text-secondary mt-1">
              Engineered devices backed by guaranteed double-entry financial settlement
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSearchParams(cat.id === 'all' ? {} : { category: cat.id })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-primary text-app font-semibold shadow-subtle'
                      : 'bg-surface hover:bg-surface-elevated text-secondary hover:text-primary border border-border'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <Link
              key={product.id}
              to={`/products/${product.id}`}
              className="group surface-card hover:border-border-bright flex flex-col overflow-hidden"
            >
              {/* Product Image */}
              <div className="relative aspect-square overflow-hidden bg-surface-elevated">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                
                {/* Badge if available */}
                {product.badge && (
                  <div className="absolute top-3 left-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-surface/90 backdrop-blur-sm border border-border text-primary">
                      {product.badge}
                    </span>
                  </div>
                )}

                <div className="absolute top-3 right-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                    product.stockStatus === 'Low Stock' 
                      ? 'bg-warning/20 text-warning border border-warning/30' 
                      : 'bg-surface/90 text-secondary border border-border'
                  }`}>
                    {product.stockStatus}
                  </span>
                </div>
              </div>

              {/* Product Details */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="text-[11px] font-mono text-secondary uppercase tracking-wider">
                    {product.brand}
                  </div>
                  <h3 className="text-sm font-semibold text-primary group-hover:text-accent transition-colors leading-snug line-clamp-1">
                    {product.name}
                  </h3>
                  <p className="text-xs text-secondary leading-relaxed line-clamp-2">
                    {product.summary}
                  </p>
                </div>

                {/* Price and CTA */}
                <div className="pt-3 border-t border-border flex items-center justify-between">
                  <div className="font-mono font-bold text-base text-primary t-num">
                    {formatINR(product.price)}
                  </div>

                  <button
                    onClick={(e) => handleAddToCart(product, e)}
                    className="p-2 rounded-lg bg-surface-elevated hover:bg-accent hover:text-app text-secondary transition-colors border border-border"
                    title="Add to cart"
                    aria-label={`Add ${product.name} to cart`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Trust & Architecture Principles Section */}
      <section className="surface-card p-8 sm:p-12 border-border space-y-8">
        <div className="max-w-2xl">
          <h3 className="text-xl font-bold text-primary tracking-tight">
            How FinCommerce processes your transaction
          </h3>
          <p className="text-xs sm:text-sm text-secondary mt-2 leading-relaxed">
            Unlike standard e-commerce carts that write loose records, every purchase in FinCommerce runs through a distributed financial lifecycle.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-xl bg-surface-elevated border border-border space-y-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-semibold text-primary">Deterministic Idempotency</h4>
            <p className="text-xs text-secondary leading-relaxed">
              Every checkout request generates a distinct idempotency key. Network retries or rapid double-clicks return identical cached authorization receipts without charging twice.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-surface-elevated border border-border space-y-2.5">
            <div className="w-8 h-8 rounded-lg bg-success/10 border border-success/20 flex items-center justify-center text-success">
              <Cpu className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-semibold text-primary">Balanced Double-Entry</h4>
            <p className="text-xs text-secondary leading-relaxed">
              Every transaction creates corresponding debits (Cash Clearing) and credits (Sales Revenue + 18% GST). Unbalanced entries are mathematically rejected.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-surface-elevated border border-border space-y-2.5">
            <div className="w-8 h-8 rounded-lg bg-warning/10 border border-warning/20 flex items-center justify-center text-warning">
              <Terminal className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-semibold text-primary">Automated DLQ Quarantine</h4>
            <p className="text-xs text-secondary leading-relaxed">
              Transactions flagged by the rules engine with a risk score $\ge 70$ divert to an Amazon SQS Dead-Letter Queue for audit review rather than dropping silently.
            </p>
          </div>
        </div>

        <div className="pt-2 flex justify-start">
          <Link
            to="/console"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-accent-hover transition-colors"
          >
            <span>Open operations console to inspect live queues</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
