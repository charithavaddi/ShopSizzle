import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, ArrowLeft, ShoppingBag, ShieldCheck, Lock } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatINR } from '../data/products';

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, totalCount, subtotal, tax, finalTotal } = useCart();
  const navigate = useNavigate();

  if (cart.length === 0) {
    return (
      <div className="surface-card p-12 text-center max-w-lg mx-auto space-y-4 my-12 animate-fade-in">
        <div className="w-12 h-12 rounded-full bg-surface-elevated border border-border flex items-center justify-center text-secondary mx-auto">
          <ShoppingBag className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-primary">Your cart is empty</h2>
        <p className="text-xs text-secondary leading-relaxed max-w-sm mx-auto">
          Explore our collection of performance laptops, audiophile headphones, processors, and graphics hardware.
        </p>
        <div className="pt-2">
          <Link to="/" className="btn-primary">
            <ArrowLeft className="w-4 h-4" />
            <span>Explore Hardware</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="border-b border-border pb-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-primary">Shopping Cart</h1>
        <span className="text-xs font-mono text-secondary">
          {totalCount} {totalCount === 1 ? 'item' : 'items'} ready for settlement
        </span>
      </div>

      {/* Cart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Cart Item List (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="divide-y divide-border surface-card overflow-hidden">
            {cart.map((item) => (
              <div key={item.id} className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                
                {/* Item Thumbnail & Info */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-surface-elevated border border-border p-2 flex items-center justify-center flex-shrink-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>

                  <div className="space-y-1 min-w-0">
                    <span className="text-[10px] font-mono uppercase text-secondary">{item.brand}</span>
                    <h3 className="text-sm font-semibold text-primary truncate">
                      <Link to={`/products/${item.id}`} className="hover:text-accent transition-colors">
                        {item.name}
                      </Link>
                    </h3>
                    <p className="text-xs text-secondary font-mono">
                      Unit price: {formatINR(item.price)}
                    </p>
                  </div>
                </div>

                {/* Quantity & Subtotal Controls */}
                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-border/60">
                  
                  {/* Quantity selector */}
                  <div className="flex items-center rounded-lg bg-surface-elevated border border-border h-9 px-1.5">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-1 text-secondary hover:text-primary transition"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center font-mono font-medium text-xs text-primary">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-1 text-secondary hover:text-primary transition"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Item Subtotal */}
                  <div className="font-mono font-bold text-sm text-primary t-num min-w-[90px] text-right">
                    {formatINR(item.price * item.quantity)}
                  </div>

                  {/* Remove action */}
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-1.5 text-secondary hover:text-error transition"
                    title="Remove item"
                    aria-label={`Remove ${item.name} from cart`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                </div>

              </div>
            ))}
          </div>

          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs font-medium text-secondary hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Continue Shopping</span>
            </Link>
          </div>
        </div>

        {/* Order Summary Column (4 cols) */}
        <div className="lg:col-span-4 surface-card p-6 space-y-6">
          <h2 className="text-sm font-bold text-primary tracking-tight">Order Summary</h2>

          <div className="space-y-3 text-xs font-mono">
            <div className="flex justify-between text-secondary">
              <span>Hardware Subtotal</span>
              <span className="text-primary t-num">{formatINR(subtotal)}</span>
            </div>

            <div className="flex justify-between text-secondary">
              <span className="flex items-center gap-1">
                <span>GST (18%)</span>
                <span className="text-[10px] text-secondary-muted">CGST + SGST</span>
              </span>
              <span className="text-primary t-num">{formatINR(tax)}</span>
            </div>

            <div className="flex justify-between text-secondary">
              <span>Standard Insured Shipping</span>
              <span className="text-success font-medium">FREE</span>
            </div>

            <div className="pt-3 border-t border-border flex justify-between text-sm font-bold">
              <span className="text-primary font-sans">Estimated Total</span>
              <span className="text-accent text-base t-num">{formatINR(finalTotal)}</span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={() => navigate('/checkout')}
              className="btn-primary w-full py-3"
            >
              <Lock className="w-4 h-4" />
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-secondary font-mono text-center">
              <ShieldCheck className="w-3.5 h-3.5 text-success" />
              <span>Deterministic Idempotency Key Guard</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
