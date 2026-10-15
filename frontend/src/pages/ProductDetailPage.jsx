import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, ShieldCheck, Check, Package, Sparkles, Plus, Minus } from 'lucide-react';
import { PRODUCTS, formatINR } from '../data/products';
import { useCart } from '../context/CartContext';
import { useToast } from '../components/ToastProvider';

export default function ProductDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const toast = useToast();
  const [quantity, setQuantity] = useState(1);

  const product = PRODUCTS.find((p) => p.id === productId);

  if (!product) {
    return (
      <div className="surface-card p-12 text-center max-w-lg mx-auto space-y-4">
        <h2 className="text-xl font-bold text-primary">Hardware item not found</h2>
        <p className="text-xs text-secondary">
          The requested hardware product does not exist in our catalog.
        </p>
        <Link to="/" className="btn-primary inline-flex">
          Return to catalog
        </Link>
      </div>
    );
  }

  const handleAdd = () => {
    addToCart(product, quantity);
    toast.success(`Added ${quantity} &times; ${product.name} to cart`);
  };

  return (
    <div className="space-y-12 animate-fade-in">
      {/* Back button */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-secondary hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Hardware Catalog</span>
        </Link>
      </div>

      {/* Main Product Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* Left Column: Product Gallery / Image */}
        <div className="lg:col-span-6 space-y-4">
          <div className="aspect-square rounded-2xl overflow-hidden bg-surface-elevated border border-border p-8 flex items-center justify-center">
            <img
              src={product.image}
              alt={product.name}
              className="max-h-full max-w-full object-contain"
            />
          </div>

          <div className="p-4 rounded-xl bg-surface border border-border flex items-center justify-between text-xs text-secondary font-mono">
            <span>FINCOMMERCE HARDWARE SPEC</span>
            <span className="text-success flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              Verified Authentic
            </span>
          </div>
        </div>

        {/* Right Column: Information, Pricing, Purchase controls */}
        <div className="lg:col-span-6 space-y-8">
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono uppercase tracking-wider bg-surface-elevated border border-border text-secondary">
                {product.brand}
              </span>
              {product.badge && (
                <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-accent/10 border border-accent/20 text-accent">
                  {product.badge}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
              {product.name}
            </h1>

            <p className="text-sm text-secondary leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Pricing Box */}
          <div className="p-6 rounded-xl bg-surface border border-border space-y-4">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-xs text-secondary font-mono">Retail Price (Inclusive of all taxes)</span>
                <div className="text-3xl font-bold font-mono text-primary t-num mt-1">
                  {formatINR(product.price)}
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded text-xs font-mono font-medium ${
                product.stockStatus === 'Low Stock' 
                  ? 'bg-warning/20 text-warning border border-warning/30' 
                  : 'bg-success/20 text-success border border-success/30'
              }`}>
                {product.stockStatus} ({product.stockCount} left)
              </span>
            </div>

            {/* Quantity Selector & Add Button */}
            <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <div className="flex items-center rounded-lg bg-surface-elevated border border-border h-11 px-2">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-1.5 text-secondary hover:text-primary transition"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-mono font-semibold text-sm text-primary">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.stockCount, q + 1))}
                  className="p-1.5 text-secondary hover:text-primary transition"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={handleAdd}
                className="btn-primary flex-1 h-11"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Add to Cart &bull; {formatINR(product.price * quantity)}</span>
              </button>
            </div>
          </div>

          {/* In the box package contents */}
          {product.inTheBox && (
            <div className="surface-card p-5 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-secondary flex items-center gap-2">
                <Package className="w-4 h-4 text-accent" />
                What's in the box
              </h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-primary">
                {product.inTheBox.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>
      </div>

      {/* Detailed Technical Specifications Table */}
      <section className="surface-card p-6 sm:p-8 space-y-6">
        <div className="border-b border-border pb-4">
          <h2 className="text-lg font-bold text-primary tracking-tight">Technical Specifications</h2>
          <p className="text-xs text-secondary mt-0.5">Comprehensive hardware architecture breakdown</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-xs font-mono">
          {Object.entries(product.specs || {}).map(([key, val]) => (
            <div key={key} className="py-2.5 border-b border-border/60 flex flex-col sm:flex-row sm:justify-between gap-1">
              <span className="text-secondary font-sans font-medium">{key}</span>
              <span className="text-primary font-mono sm:text-right max-w-sm">{val}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
