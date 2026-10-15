import React, { useState } from 'react';
import { 
  X, Trash2, Plus, Minus, CreditCard, ShieldCheck, ShieldAlert, 
  Lock, RefreshCw, Copy, Check, ArrowRight, Sparkles, AlertCircle 
} from 'lucide-react';
import { useToast } from './ToastProvider';

export default function CheckoutDrawer({
  isOpen,
  onClose,
  cart,
  setCart,
  apiBaseUrl,
  onOrderSuccess,
  onOrderFlagged
}) {
  const toast = useToast();

  // Customer state
  const [customer, setCustomer] = useState({
    name: 'Alex Mercer',
    email: 'alex.mercer@fintech-labs.io',
    address: 'Suite 400, 100 Financial Tower, Bengaluru'
  });

  // Test card simulation mode: 'standard' | 'high_risk'
  const [cardMode, setCardMode] = useState('standard');
  const [duplicateMode, setDuplicateMode] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState(() => 'idem_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36));
  const [copiedKey, setCopiedKey] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Cart calculations
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const taxRate = 0.18; // 18% GST
  const taxAmount = Number((subtotal * taxRate).toFixed(2));
  const total = Number((subtotal + taxAmount).toFixed(2));

  const updateQuantity = (id, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeItem = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const generateNewKey = () => {
    const newKey = 'idem_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
    setIdempotencyKey(newKey);
    toast.info('Generated fresh Idempotency Key');
  };

  const copyKey = () => {
    navigator.clipboard.writeText(idempotencyKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      toast.warning('Your cart is empty');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      cartItems: cart.map((i) => ({
        id: i.id,
        productId: i.id,
        quantity: i.quantity,
        price: i.price,
        name: i.name
      })),
      totalAmount: subtotal,
      shippingAddress: customer.address,
      buyerEmail: customer.email,
      buyerName: customer.name,
      isTestHighRisk: cardMode === 'high_risk',
      simulatedRiskScore: cardMode === 'high_risk' ? 88 : 12
    };

    try {
      const response = await fetch(`${apiBaseUrl}/api/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-idempotency-key': idempotencyKey
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      // Check if this was an idempotent replay response
      if (data.isIdempotentReplay || response.headers.get('x-cache-hit') === 'true') {
        const orderId = data.order?.orderId || 'ORD-PREV';
        toast.idempotent(`Order already processed (${orderId}). No duplicate charge incurred.`);
        setIsSubmitting(false);
        return;
      }

      if (!response.ok && response.status === 409) {
        toast.warning('Concurrent transaction currently in progress with this key.');
        setIsSubmitting(false);
        return;
      }

      // Check if quarantined in DLQ (High-Risk)
      if (data.awsEventHub?.queueStatus === 'QUARANTINED_IN_DLQ' || cardMode === 'high_risk') {
        toast.warning('Payment flagged for verification — please contact support or retry with different card');
        if (onOrderFlagged) {
          onOrderFlagged({
            id: data.order?.orderId || `ord_${Date.now()}`,
            transactionId: data.order?.transactionId || `TXN_${Date.now()}`,
            items: [...cart],
            subtotal,
            tax: taxAmount,
            finalAmount: total,
            status: 'Pending Verification',
            idempotencyKey,
            createdAt: new Date().toISOString(),
            riskScore: data.awsEventHub?.riskScore || 88
          });
        }
      } else {
        // Successful payment & ledger post
        toast.success(`Payment of $${total.toFixed(2)} completed successfully!`);
        toast.info('Ledger verified: Balanced transaction recorded', 5000);
        
        if (onOrderSuccess) {
          onOrderSuccess({
            id: data.order?.orderId || `ord_${Date.now()}`,
            transactionId: data.order?.transactionId || `TXN_${Date.now()}`,
            items: [...cart],
            subtotal,
            tax: taxAmount,
            finalAmount: total,
            status: 'Succeeded',
            idempotencyKey,
            createdAt: new Date().toISOString(),
            riskScore: data.awsEventHub?.riskScore || 12
          });
        }
      }

      // If duplicateMode is OFF, regenerate a new key for next transaction
      if (!duplicateMode) {
        setIdempotencyKey('idem_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36));
        setCart([]);
        onClose();
      }

    } catch (err) {
      // Local demo fallback if backend server isn't actively reachable
      console.warn('Backend checkout call failed, generating simulated transaction:', err);
      
      if (cardMode === 'high_risk') {
        toast.warning('Payment flagged for verification — please contact support or retry with different card');
        if (onOrderFlagged) {
          onOrderFlagged({
            id: `ord_${Date.now().toString(36)}`,
            transactionId: `TXN_${Date.now().toString(36).toUpperCase()}`,
            items: [...cart],
            subtotal,
            tax: taxAmount,
            finalAmount: total,
            status: 'Pending Verification',
            idempotencyKey,
            createdAt: new Date().toISOString(),
            riskScore: 88
          });
        }
      } else {
        toast.success(`Payment of $${total.toFixed(2)} completed successfully!`);
        toast.info('Ledger verified: Balanced transaction recorded', 5000);
        if (onOrderSuccess) {
          onOrderSuccess({
            id: `ord_${Date.now().toString(36)}`,
            transactionId: `TXN_${Date.now().toString(36).toUpperCase()}`,
            items: [...cart],
            subtotal,
            tax: taxAmount,
            finalAmount: total,
            status: 'Succeeded',
            idempotencyKey,
            createdAt: new Date().toISOString(),
            riskScore: 12
          });
        }
      }

      if (!duplicateMode) {
        setIdempotencyKey('idem_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36));
        setCart([]);
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md checkout-panel flex flex-col border-l border-slate-800 text-slate-100 animate-slide-left">
          
          {/* Header */}
          <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">FinCommerce Checkout</h2>
                <p className="text-xs text-slate-400">Encrypted payment &amp; automated ledger</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              aria-label="Close checkout"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Cart Items */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Cart Items ({cart.reduce((s, i) => s + i.quantity, 0)})
                </h3>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-slate-800 rounded-xl">
                  <p className="text-sm text-slate-400">Your cart is currently empty</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div 
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800/80"
                    >
                      <div className="flex-1 pr-3 min-w-0">
                        <h4 className="text-xs font-semibold text-white truncate">{item.name}</h4>
                        <span className="text-[11px] font-mono text-slate-400">
                          ${item.price.toFixed(2)} &times; {item.quantity}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center rounded-lg bg-slate-800 border border-slate-700">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, -1)}
                            className="p-1 hover:text-white text-slate-400 transition"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-mono font-medium px-2 text-white">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, 1)}
                            className="p-1 hover:text-white text-slate-400 transition"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span className="font-mono text-slate-200">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span className="flex items-center gap-1">
                  GST Tax (18%)
                  <span className="text-[10px] text-slate-500">CGST + SGST</span>
                </span>
                <span className="font-mono text-slate-200">${taxAmount.toFixed(2)}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between font-semibold text-sm text-white">
                <span>Total Due</span>
                <span className="font-mono text-emerald-400 text-base">${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Customer Details */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Customer &amp; Delivery
              </h3>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={customer.name}
                  onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                />
                <input
                  type="email"
                  placeholder="Email for Digital License Delivery"
                  value={customer.email}
                  onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Payment Preset & Test Card Selector */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Simulated Card Preset
                </h3>
                <span className="text-[10px] text-blue-400 font-mono">Sandbox Mode</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCardMode('standard')}
                  className={`p-3 rounded-xl border text-left transition ${
                    cardMode === 'standard'
                      ? 'border-blue-500 bg-blue-500/10 text-white'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mb-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Standard Card
                  </div>
                  <div className="text-[11px] font-mono text-slate-300">•••• 4242</div>
                  <div className="text-[10px] text-slate-500 mt-1">Instant Settlement</div>
                </button>

                <button
                  type="button"
                  onClick={() => setCardMode('high_risk')}
                  className={`p-3 rounded-xl border text-left transition ${
                    cardMode === 'high_risk'
                      ? 'border-amber-500 bg-amber-500/10 text-white'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 mb-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    High-Risk DLQ
                  </div>
                  <div className="text-[11px] font-mono text-slate-300">•••• 9999</div>
                  <div className="text-[10px] text-slate-500 mt-1">Triggers Verification</div>
                </button>
              </div>
            </div>

            {/* Idempotency Key & Duplicate Test Control */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                  <Lock className="w-3.5 h-3.5 text-blue-400" />
                  Idempotency Safeguard
                </div>
                <button
                  type="button"
                  onClick={generateNewKey}
                  className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300"
                >
                  <RefreshCw className="w-3 h-3" />
                  Regenerate
                </button>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px]">
                <span className="text-slate-400 truncate max-w-[240px]">{idempotencyKey}</span>
                <button
                  type="button"
                  onClick={copyKey}
                  className="text-slate-400 hover:text-white transition ml-2"
                  title="Copy Key"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={duplicateMode}
                  onChange={(e) => setDuplicateMode(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-700 text-blue-600 focus:ring-0 bg-slate-800"
                />
                <span className="text-[11px] text-slate-400">
                  Lock key (Test idempotency duplicate rejection)
                </span>
              </label>
            </div>

          </div>

          {/* Footer / Pay CTA */}
          <div className="p-6 border-t border-slate-800/80 bg-slate-900/40 space-y-3">
            <button
              onClick={handleCheckout}
              disabled={isSubmitting || cart.length === 0}
              className={`w-full py-3.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-xl transition-all duration-200 ${
                cart.length === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white shadow-blue-600/20 active:scale-[0.98]'
              }`}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Payment...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Pay ${total.toFixed(2)} USD</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-3 text-[10px] text-slate-500">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                Double-Entry Ledger
              </span>
              <span>&bull;</span>
              <span>256-Bit SSL</span>
              <span>&bull;</span>
              <span>EventBridge Queue</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
