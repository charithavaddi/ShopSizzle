import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Search, CheckCircle2, Clock, AlertTriangle, ChevronRight, Copy, Check, ArrowRight } from 'lucide-react';
import { useOps } from '../context/OpsContext';
import { formatINR } from '../data/products';
import { useToast } from '../components/ToastProvider';

export default function OrdersPage() {
  const { orders } = useOps();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [copiedKey, setCopiedKey] = useState(null);

  const copyKey = (text, id, e) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    toast.info('Copied identifier to clipboard');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const filteredOrders = orders.filter((order) => {
    const term = search.toLowerCase();
    const matchesSearch =
      (order.id && order.id.toLowerCase().includes(term)) ||
      (order.transactionId && order.transactionId.toLowerCase().includes(term)) ||
      (order.customerName && order.customerName.toLowerCase().includes(term));

    if (!matchesSearch) return false;
    if (filter === 'ALL') return true;
    if (filter === 'SUCCEEDED') return order.status === 'SUCCEEDED';
    if (filter === 'QUARANTINED') return order.status === 'QUARANTINED';
    return true;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="border-b border-border pb-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">Order History &amp; Settlements</h1>
          <p className="text-xs text-secondary mt-1">
            Real-time transaction log with double-entry general ledger verification and DLQ status
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Order, TXN, Name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg bg-surface border border-border text-primary placeholder-secondary focus:outline-none focus:border-accent w-48 sm:w-60"
            />
          </div>

          <div className="flex rounded-lg bg-surface border border-border p-0.5 text-xs font-medium">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1 rounded-md transition ${
                filter === 'ALL' ? 'bg-surface-elevated text-primary font-semibold' : 'text-secondary hover:text-primary'
              }`}
            >
              All ({orders.length})
            </button>
            <button
              onClick={() => setFilter('SUCCEEDED')}
              className={`px-3 py-1 rounded-md transition ${
                filter === 'SUCCEEDED' ? 'bg-success/20 text-success font-semibold' : 'text-secondary hover:text-primary'
              }`}
            >
              Succeeded
            </button>
            <button
              onClick={() => setFilter('QUARANTINED')}
              className={`px-3 py-1 rounded-md transition ${
                filter === 'QUARANTINED' ? 'bg-warning/20 text-warning font-semibold' : 'text-secondary hover:text-primary'
              }`}
            >
              Quarantined (DLQ)
            </button>
          </div>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="surface-card p-12 text-center max-w-md mx-auto space-y-3">
          <BookOpen className="w-8 h-8 text-secondary mx-auto" />
          <h3 className="text-sm font-semibold text-primary">No orders found</h3>
          <p className="text-xs text-secondary">
            {search ? 'Try adjusting your search criteria.' : 'Checkout items from the store to create an order.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const isSuccess = order.status === 'SUCCEEDED';
            const isQuarantined = order.status === 'QUARANTINED';

            return (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="block surface-card p-5 hover:border-border-bright transition-all group"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  
                  {/* Left: Identifiers & Customer */}
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono text-sm font-bold text-primary">
                        {order.id}
                      </span>

                      {/* Status badge */}
                      {isSuccess ? (
                        <span className="badge-success">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Succeeded &bull; Ledger Posted</span>
                        </span>
                      ) : isQuarantined ? (
                        <span className="badge-warning">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Quarantined in DLQ (Score {order.riskScore}/100)</span>
                        </span>
                      ) : (
                        <span className="badge-error">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Payment Failed</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono text-secondary flex-wrap">
                      <div>
                        <span>TXN: </span>
                        <span className="text-primary">{order.transactionId}</span>
                        <button
                          onClick={(e) => copyKey(order.transactionId, `txn-${order.id}`, e)}
                          className="ml-1 hover:text-primary"
                        >
                          {copiedKey === `txn-${order.id}` ? (
                            <Check className="w-3 h-3 text-success inline" />
                          ) : (
                            <Copy className="w-3 h-3 inline" />
                          )}
                        </button>
                      </div>

                      <span>&bull;</span>
                      <span className="font-sans text-secondary">{order.customerName}</span>
                      <span>&bull;</span>
                      <span>{new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    {/* Items chips */}
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      {order.items?.map((it, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded bg-surface-elevated border border-border text-[11px] text-primary"
                        >
                          {it.name} &times; {it.quantity}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Right: Amount & Action */}
                  <div className="flex items-center justify-between lg:justify-end gap-6 pt-3 lg:pt-0 border-t lg:border-t-0 border-border/60">
                    <div className="text-right">
                      <div className="font-mono text-lg font-bold text-primary t-num">
                        {formatINR(order.finalAmount)}
                      </div>
                      <div className="text-[11px] font-mono text-secondary">
                        GST: {formatINR(order.tax)}
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-surface-elevated group-hover:bg-accent group-hover:text-app text-secondary transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>

                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
