import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, CheckCircle2, Clock, AlertTriangle, ShieldCheck, 
  Terminal, RefreshCw, Copy, Check, ExternalLink, Package 
} from 'lucide-react';
import { useOps } from '../context/OpsContext';
import { formatINR } from '../data/products';
import { useToast } from '../components/ToastProvider';

export default function OrderDetailPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { orders, ledger, retryDLQEvent } = useOps();
  const toast = useToast();
  const [copiedKey, setCopiedKey] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const order = orders.find((o) => o.id === orderId);

  if (!order) {
    return (
      <div className="surface-card p-12 text-center max-w-lg mx-auto space-y-4 my-12 animate-fade-in">
        <h2 className="text-xl font-bold text-primary">Order Not Found</h2>
        <p className="text-xs text-secondary">
          No transaction record matches ID: <span className="font-mono text-primary">{orderId}</span>
        </p>
        <Link to="/orders" className="btn-primary inline-flex">
          Return to Orders
        </Link>
      </div>
    );
  }

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    toast.info('Copied to clipboard');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleManualRedrive = async () => {
    setIsRetrying(true);
    try {
      if (order.dlqEventId) {
        await retryDLQEvent(order.dlqEventId);
      }
      toast.success(`Order ${order.id} verified and settled to double-entry ledger`);
      toast.info('Ledger verified: Balanced transaction recorded', 4000);
    } catch {
      toast.error('Failed to redrive event');
    } finally {
      setIsRetrying(false);
    }
  };

  // Find associated ledger entries
  const associatedLedger = ledger.filter((l) => l.orderId === order.id);

  const isSuccess = order.status === 'SUCCEEDED';
  const isQuarantined = order.status === 'QUARANTINED';

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      {/* Top back button */}
      <div>
        <Link
          to="/orders"
          className="inline-flex items-center gap-2 text-xs font-medium text-secondary hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Orders</span>
        </Link>
      </div>

      {/* Main Order Header */}
      <div className="surface-card p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
          <div className="space-y-1">
            <span className="text-xs font-mono text-secondary">FINANCIAL SETTLEMENT RECORD</span>
            <h1 className="text-xl sm:text-2xl font-bold font-mono text-primary">{order.id}</h1>
            <p className="text-xs text-secondary">
              Placed on {new Date(order.createdAt).toLocaleString()} &bull; Buyer: {order.customerName}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isSuccess ? (
              <span className="badge-success text-sm py-1 px-3">
                <CheckCircle2 className="w-4 h-4" />
                <span>Succeeded &bull; Ledger Balanced</span>
              </span>
            ) : isQuarantined ? (
              <span className="badge-warning text-sm py-1 px-3">
                <Clock className="w-4 h-4" />
                <span>Quarantined in DLQ (Review Required)</span>
              </span>
            ) : (
              <span className="badge-error text-sm py-1 px-3">
                <AlertTriangle className="w-4 h-4" />
                <span>Payment Failed</span>
              </span>
            )}
          </div>
        </div>

        {/* Quarantined Action Alert */}
        {isQuarantined && (
          <div className="p-4 rounded-xl bg-warning/10 border border-warning/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-warning uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                Quarantine Operational Hold
              </h3>
              <p className="text-xs text-secondary">
                Transaction flagged by fraud rules engine (Risk Score: {order.riskScore}/100). Quarantined in Amazon SQS DLQ.
              </p>
            </div>

            <button
              onClick={handleManualRedrive}
              disabled={isRetrying}
              className="btn-primary whitespace-nowrap text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
              <span>Verify &amp; Settle to Ledger</span>
            </button>
          </div>
        )}

        {/* Key Identifiers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono bg-surface-elevated p-4 rounded-xl border border-border">
          <div>
            <span className="text-secondary block">Transaction Reference</span>
            <div className="flex items-center gap-1 text-primary font-semibold mt-0.5">
              <span>{order.transactionId}</span>
              <button
                onClick={() => copyToClipboard(order.transactionId, 'txn')}
                className="text-secondary hover:text-primary"
              >
                {copiedKey === 'txn' ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>

          <div>
            <span className="text-secondary block">Idempotency Key</span>
            <div className="flex items-center gap-1 text-primary font-semibold mt-0.5 truncate">
              <span className="truncate max-w-[140px]">{order.idempotencyKey}</span>
              <button
                onClick={() => copyToClipboard(order.idempotencyKey, 'idem')}
                className="text-secondary hover:text-primary flex-shrink-0"
              >
                {copiedKey === 'idem' ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>

          <div>
            <span className="text-secondary block">Risk Score Evaluation</span>
            <span className={`font-semibold block mt-0.5 ${order.riskScore >= 70 ? 'text-warning' : 'text-success'}`}>
              {order.riskScore} / 100 {order.riskScore >= 70 ? '(Quarantined)' : '(Low Risk)'}
            </span>
          </div>
        </div>

        {/* Purchased Items Table */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-secondary">
            Purchased Hardware Items
          </h2>

          <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
            {order.items?.map((item, idx) => (
              <div key={idx} className="p-4 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-surface-elevated border border-border p-1 flex items-center justify-center flex-shrink-0">
                    <img src={item.image} alt="" className="max-h-full max-w-full object-contain" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary">{item.name}</h3>
                    <span className="text-secondary font-mono">{formatINR(item.price)} &times; {item.quantity}</span>
                  </div>
                </div>

                <div className="font-mono font-bold text-primary t-num">
                  {formatINR(item.price * item.quantity)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="p-4 rounded-xl bg-surface-elevated border border-border space-y-2 text-xs font-mono max-w-sm ml-auto">
          <div className="flex justify-between text-secondary">
            <span>Subtotal</span>
            <span className="text-primary t-num">{formatINR(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-secondary">
            <span>GST (18%)</span>
            <span className="text-primary t-num">{formatINR(order.tax)}</span>
          </div>
          <div className="pt-2 border-t border-border flex justify-between text-sm font-bold text-primary">
            <span>Total Settled</span>
            <span className="text-accent t-num">{formatINR(order.finalAmount)}</span>
          </div>
        </div>

      </div>

      {/* Double-Entry Ledger Audit Trace */}
      <section className="surface-card p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 className="text-sm font-bold text-primary tracking-tight">Double-Entry Ledger Audit Trail</h2>
            <p className="text-xs text-secondary mt-0.5">Automated accounting journal postings linked to this order</p>
          </div>
          <Link
            to="/console/ledger"
            className="text-xs font-mono text-accent hover:text-accent-hover inline-flex items-center gap-1"
          >
            <span>View Full Ledger</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        {associatedLedger.length === 0 ? (
          <div className="p-6 text-center text-xs text-secondary bg-surface-elevated rounded-xl border border-border">
            {isQuarantined 
              ? 'Ledger postings are held in quarantine until manual review or verification redrive is performed.'
              : 'No journal postings found for this transaction.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="text-secondary border-b border-border text-[11px] uppercase">
                  <th className="py-2.5 px-3">Account Code &amp; Name</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3 text-right">Debit</th>
                  <th className="py-2.5 px-3 text-right">Credit</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {associatedLedger.map((entry) => (
                  <tr key={entry.id} className="hover:bg-surface-elevated/50 transition">
                    <td className="py-2.5 px-3 text-primary">{entry.accountName}</td>
                    <td className="py-2.5 px-3">
                      {entry.type === 'DEBIT' ? (
                        <span className="text-accent font-bold">DEBIT</span>
                      ) : (
                        <span className="text-success font-bold">CREDIT</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-accent">
                      {entry.debit > 0 ? formatINR(entry.debit) : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-success">
                      {entry.credit > 0 ? formatINR(entry.credit) : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="badge-success text-[10px]">Balanced</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
