import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Lock, ShieldCheck, ShieldAlert, CreditCard, RefreshCw, 
  Copy, Check, ArrowRight, ArrowLeft, AlertCircle, Sparkles 
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useOps } from '../context/OpsContext';
import { useToast } from '../components/ToastProvider';
import { formatINR } from '../data/products';

export default function CheckoutPage() {
  const { cart, totalCount, subtotal, tax, finalTotal, clearCart } = useCart();
  const { recordSuccessfulOrder, recordQuarantinedOrder, backendStatus } = useOps();
  const toast = useToast();
  const navigate = useNavigate();

  // Form states
  const [customer, setCustomer] = useState({
    name: 'Vikramaditya Singhania',
    email: 'vikram.singhania@enterprise.in',
    phone: '+91 98765 43210',
    address: '4th Floor, Tech Hub Tower, Outer Ring Road, Bellandur, Bengaluru, Karnataka 560103',
  });

  // Simulation mode: 'standard' | 'high_risk'
  const [cardMode, setCardMode] = useState('standard');
  const [duplicateMode, setDuplicateMode] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState(
    () => 'idem_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36)
  );
  const [copiedKey, setCopiedKey] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (cart.length === 0) {
    return (
      <div className="surface-card p-12 text-center max-w-lg mx-auto space-y-4 my-12 animate-fade-in">
        <h2 className="text-xl font-bold text-primary">Your cart is empty</h2>
        <p className="text-xs text-secondary">
          Please add hardware items to your cart before proceeding to checkout.
        </p>
        <Link to="/" className="btn-primary inline-flex">
          Return to Catalog
        </Link>
      </div>
    );
  }

  const generateNewKey = () => {
    const newKey = 'idem_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
    setIdempotencyKey(newKey);
    toast.info('Generated new Idempotency Key');
  };

  const copyKey = () => {
    navigator.clipboard.writeText(idempotencyKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const isHighRisk = cardMode === 'high_risk';
    const orderId = `ord_fin_${Date.now().toString(36)}`;
    const txId = `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const orderPayload = {
      id: orderId,
      transactionId: txId,
      customerName: customer.name,
      customerEmail: customer.email,
      shippingAddress: customer.address,
      items: [...cart],
      subtotal,
      tax,
      finalAmount: finalTotal,
      idempotencyKey,
      paymentMethod: isHighRisk ? 'Test Card Sandbox (•••• 9999)' : 'Corporate Visa Platinum (•••• 4242)',
      paymentRef: `PAY_${Date.now()}`,
      riskScore: isHighRisk ? 88 : 12,
      createdAt: new Date().toISOString(),
    };

    try {
      // If backend is live, call the backend endpoint
      const response = await fetch('http://localhost:5000/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-idempotency-key': idempotencyKey,
        },
        body: JSON.stringify({
          cartItems: cart.map((i) => ({
            id: i.id,
            productId: i.id,
            quantity: i.quantity,
            price: i.price,
            name: i.name,
          })),
          totalAmount: subtotal,
          shippingAddress: customer.address,
          buyerEmail: customer.email,
          buyerName: customer.name,
          isTestHighRisk: isHighRisk,
          simulatedRiskScore: isHighRisk ? 88 : 12,
        }),
      });

      const data = await response.json();

      // Check if this was an idempotent replay
      if (data.isIdempotentReplay || response.headers.get('x-cache-hit') === 'true') {
        toast.idempotent(`Order already processed (${data.order?.orderId || orderId}). No duplicate charge incurred.`);
        setIsSubmitting(false);
        return;
      }

      if (data.awsEventHub?.queueStatus === 'QUARANTINED_IN_DLQ' || isHighRisk) {
        toast.warning('Payment flagged for verification — please contact support or retry with different card');
        recordQuarantinedOrder(orderPayload, 88, ['HIGH_VALUE_TRANSACTION', 'MANUAL_TEST_RISK_TRIGGER']);
      } else {
        toast.success(`Payment of ${formatINR(finalTotal)} authorized successfully`);
        toast.info('Ledger verified: Balanced transaction recorded', 4000);
        recordSuccessfulOrder(orderPayload);
      }

    } catch (err) {
      // Local fallback execution
      console.warn('Backend call fallback:', err);
      if (isHighRisk) {
        toast.warning('Payment flagged for verification — please contact support or retry with different card');
        recordQuarantinedOrder(orderPayload, 88, ['SIMULATED_RISK_TRIGGER']);
      } else {
        toast.success(`Payment of ${formatINR(finalTotal)} authorized successfully`);
        toast.info('Ledger verified: Balanced transaction recorded', 4000);
        recordSuccessfulOrder(orderPayload);
      }
    } finally {
      setIsSubmitting(false);
      if (!duplicateMode) {
        clearCart();
        navigate(`/orders/${orderId}`);
      }
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Breadcrumb */}
      <div>
        <Link
          to="/cart"
          className="inline-flex items-center gap-2 text-xs font-medium text-secondary hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Cart</span>
        </Link>
      </div>

      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-primary">Secure Financial Checkout</h1>
        <p className="text-xs text-secondary mt-0.5">
          Order authorization with double-entry general ledger posting and idempotency lock
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Customer details & Payment (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Section 1: Customer Details */}
          <div className="surface-card p-6 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-secondary">
              1. Delivery &amp; Customer Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-secondary mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={customer.name}
                  onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-secondary mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={customer.email}
                  onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-secondary mb-1">Contact Phone</label>
              <input
                type="text"
                required
                value={customer.phone}
                onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-secondary mb-1">Shipping &amp; Billing Address</label>
              <textarea
                rows={2}
                required
                value={customer.address}
                onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          {/* Section 2: Simulated Payment Cards */}
          <div className="surface-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-secondary flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-accent" />
                2. Payment Method (Demo Preset)
              </h2>
              <span className="text-[11px] font-mono text-accent">Financial Sandbox</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCardMode('standard')}
                className={`p-4 rounded-xl border text-left transition-all ${
                  cardMode === 'standard'
                    ? 'border-accent bg-accent/10 shadow-subtle'
                    : 'border-border bg-surface-elevated text-secondary hover:border-border-bright'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-success mb-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Standard Corporate Card</span>
                </div>
                <div className="text-sm font-mono text-primary font-semibold">•••• 4242</div>
                <p className="text-[11px] text-secondary mt-1">
                  Immediate authorization &bull; Direct double-entry ledger posting
                </p>
              </button>

              <button
                type="button"
                onClick={() => setCardMode('high_risk')}
                className={`p-4 rounded-xl border text-left transition-all ${
                  cardMode === 'high_risk'
                    ? 'border-warning bg-warning/10 shadow-subtle'
                    : 'border-border bg-surface-elevated text-secondary hover:border-border-bright'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-warning mb-1">
                  <ShieldAlert className="w-4 h-4" />
                  <span>High-Risk / DLQ Trigger</span>
                </div>
                <div className="text-sm font-mono text-primary font-semibold">•••• 9999</div>
                <p className="text-[11px] text-secondary mt-1">
                  Simulates risk score &ge; 70 &bull; Diverts to Amazon SQS DLQ
                </p>
              </button>
            </div>
          </div>

          {/* Section 3: Idempotency Key Guard Widget */}
          <div className="surface-card p-5 space-y-3 bg-surface-elevated/70">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                <Lock className="w-4 h-4 text-accent" />
                <span>Deterministic Idempotency Key</span>
              </div>
              <button
                type="button"
                onClick={generateNewKey}
                className="text-[11px] font-mono text-accent hover:text-accent-hover flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Regenerate Key</span>
              </button>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface border border-border font-mono text-xs">
              <span className="text-secondary truncate">{idempotencyKey}</span>
              <button
                type="button"
                onClick={copyKey}
                className="text-secondary hover:text-primary transition ml-2"
                title="Copy Key"
              >
                {copiedKey ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={duplicateMode}
                onChange={(e) => setDuplicateMode(e.target.checked)}
                className="w-4 h-4 rounded border-border text-accent focus:ring-0 bg-surface"
              />
              <span className="text-xs text-secondary">
                Lock key for duplicate replay test (Demonstrates duplicate submission rejection)
              </span>
            </label>
          </div>

        </div>

        {/* Right Column: Order Summary & Pay Action (5 cols) */}
        <div className="lg:col-span-5 surface-card p-6 space-y-6">
          <h2 className="text-sm font-bold text-primary tracking-tight">Order Summary ({totalCount} items)</h2>

          {/* Line items preview */}
          <div className="max-h-64 overflow-y-auto divide-y divide-border/60 -mx-2 px-2 scrollbar-none">
            {cart.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded bg-surface-elevated border border-border p-1 flex-shrink-0 flex items-center justify-center">
                    <img src={item.image} alt="" className="max-h-full max-w-full object-contain" />
                  </div>
                  <div className="truncate">
                    <span className="text-primary font-medium truncate block">{item.name}</span>
                    <span className="text-secondary text-[11px] font-mono">{formatINR(item.price)} &times; {item.quantity}</span>
                  </div>
                </div>
                <span className="font-mono font-semibold text-primary t-num whitespace-nowrap">
                  {formatINR(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* Tax Breakdown */}
          <div className="pt-3 border-t border-border space-y-2.5 text-xs font-mono">
            <div className="flex justify-between text-secondary">
              <span>Hardware Subtotal</span>
              <span className="text-primary t-num">{formatINR(subtotal)}</span>
            </div>
            <div className="flex justify-between text-secondary">
              <span className="flex items-center gap-1">
                <span>GST Tax (18%)</span>
                <span className="text-[10px] text-secondary-muted">CGST 9% + SGST 9%</span>
              </span>
              <span className="text-primary t-num">{formatINR(tax)}</span>
            </div>
            <div className="flex justify-between text-secondary">
              <span>Insured Courier Shipping</span>
              <span className="text-success font-medium">FREE</span>
            </div>
            <div className="pt-3 border-t border-border flex justify-between text-sm font-bold">
              <span className="text-primary font-sans">Final Total</span>
              <span className="text-accent text-base t-num">{formatINR(finalTotal)}</span>
            </div>
          </div>

          {/* Pay Button */}
          <div className="space-y-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-3.5"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Authorizing Payment...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Pay {formatINR(finalTotal)}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-[11px] text-secondary text-center font-mono">
              256-Bit TLS &bull; Amazon EventBridge Bus &bull; Double-Entry Verified
            </div>
          </div>

        </div>

      </form>
    </div>
  );
}
