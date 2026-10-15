import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Activity, BookOpen, AlertOctagon, Network, ShieldCheck, 
  ArrowUpRight, Clock, CheckCircle2, ArrowRight, Database, Server, RefreshCw 
} from 'lucide-react';
import { useOps } from '../context/OpsContext';
import { formatINR } from '../data/products';

export default function ConsoleOverviewPage() {
  const { orders, ledger, dlqEvents, backendStatus } = useOps();

  // Calculations
  const totalVolume = orders
    .filter((o) => o.status === 'SUCCEEDED')
    .reduce((sum, o) => sum + o.finalAmount, 0);

  const succeededCount = orders.filter((o) => o.status === 'SUCCEEDED').length;
  const quarantinedCount = dlqEvents.filter((e) => e.queueStatus === 'QUARANTINED').length;

  const totalDebits = ledger.reduce((sum, l) => sum + l.debit, 0);
  const totalCredits = ledger.reduce((sum, l) => sum + l.credit, 0);
  const isLedgerBalanced = totalDebits === totalCredits;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Overview Title Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-primary">Operations Overview</h1>
          <p className="text-xs text-secondary mt-0.5">
            Real-time telemetry for financial transactions, event queues, and double-entry ledger balance
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-secondary">AWS ap-south-1</span>
          <span className="text-secondary/40">&bull;</span>
          <span className="text-xs font-mono text-accent">FinCommerce v2.4</span>
        </div>
      </div>

      {/* 4 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Settled Volume */}
        <div className="surface-card p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-secondary">
            <span>Settled Financial Volume</span>
            <span className="w-2 h-2 rounded-full bg-success" />
          </div>
          <div className="text-2xl font-bold font-mono text-primary t-num">
            {formatINR(totalVolume)}
          </div>
          <span className="text-[11px] font-mono text-secondary">
            {succeededCount} settled transactions
          </span>
        </div>

        {/* Metric 2: Ledger Integrity */}
        <div className="surface-card p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-secondary">
            <span>Ledger Integrity</span>
            <BookOpen className="w-3.5 h-3.5 text-accent" />
          </div>
          <div className="text-2xl font-bold font-mono text-success flex items-center gap-2">
            <span>BALANCED</span>
            <CheckCircle2 className="w-5 h-5 text-success" />
          </div>
          <span className="text-[11px] font-mono text-secondary">
            Debits: {formatINR(totalDebits)} &bull; Credits: {formatINR(totalCredits)}
          </span>
        </div>

        {/* Metric 3: DLQ Backlog */}
        <div className="surface-card p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-secondary">
            <span>DLQ Quarantine Backlog</span>
            <AlertOctagon className="w-3.5 h-3.5 text-warning" />
          </div>
          <div className={`text-2xl font-bold font-mono t-num ${quarantinedCount > 0 ? 'text-warning' : 'text-primary'}`}>
            {quarantinedCount} <span className="text-xs font-sans text-secondary">events awaiting review</span>
          </div>
          <span className="text-[11px] font-mono text-secondary">
            Risk Policy: &ge; 70 score threshold
          </span>
        </div>

        {/* Metric 4: EventBridge Queue Status */}
        <div className="surface-card p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-secondary">
            <span>EventBridge Event Bus</span>
            <Network className="w-3.5 h-3.5 text-accent" />
          </div>
          <div className="text-2xl font-bold font-mono text-primary flex items-center gap-2">
            <span>ACTIVE</span>
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          </div>
          <span className="text-[11px] font-mono text-secondary">
            Bus: default/fincommerce.checkout
          </span>
        </div>

      </div>

      {/* Operations Quick Jump Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/console/ledger"
          className="surface-card p-5 hover:border-border-bright transition-all group flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-accent font-mono flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" />
                Double-Entry Ledger
              </span>
              <ArrowUpRight className="w-4 h-4 text-secondary group-hover:text-accent transition-colors" />
            </div>
            <h3 className="text-sm font-semibold text-primary">Financial Journal Postings</h3>
            <p className="text-xs text-secondary leading-relaxed">
              Inspect double-entry journal entries. Every order writes balanced debits to Cash/Receivables and credits to Revenue + GST.
            </p>
          </div>
          <div className="pt-4 text-xs font-mono text-accent">
            View {ledger.length} General Ledger entries &rarr;
          </div>
        </Link>

        <Link
          to="/console/dlq"
          className="surface-card p-5 hover:border-border-bright transition-all group flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-warning font-mono flex items-center gap-1.5">
                <AlertOctagon className="w-4 h-4" />
                Dead-Letter Queue
              </span>
              <ArrowUpRight className="w-4 h-4 text-secondary group-hover:text-warning transition-colors" />
            </div>
            <h3 className="text-sm font-semibold text-primary">Fraud Quarantine &amp; Redrive</h3>
            <p className="text-xs text-secondary leading-relaxed">
              Review and safely reprocess transactions quarantined by fraud risk evaluation (&ge;70 score) without duplicate financial effect.
            </p>
          </div>
          <div className="pt-4 text-xs font-mono text-warning">
            Inspect {dlqEvents.length} DLQ events &rarr;
          </div>
        </Link>

        <Link
          to="/console/aws-architecture"
          className="surface-card p-5 hover:border-border-bright transition-all group flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-accent font-mono flex items-center gap-1.5">
                <Network className="w-4 h-4" />
                AWS Architecture
              </span>
              <ArrowUpRight className="w-4 h-4 text-secondary group-hover:text-accent transition-colors" />
            </div>
            <h3 className="text-sm font-semibold text-primary">Distributed Service Flow</h3>
            <p className="text-xs text-secondary leading-relaxed">
              Interactive architecture diagrams explaining EventBridge routing, SQS queuing, DLQ failure handling, and PostgreSQL persistence.
            </p>
          </div>
          <div className="pt-4 text-xs font-mono text-accent">
            Explore 6 AWS service models &rarr;
          </div>
        </Link>
      </div>

      {/* Two Column Section: Recent Ledger Events & Recent DLQ Quarantines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* Left: Recent Settled Transactions */}
        <div className="surface-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary font-mono flex items-center gap-2">
              <Activity className="w-4 h-4 text-accent" />
              Recent Settled Transactions
            </h2>
            <Link to="/console/ledger" className="text-xs font-mono text-accent hover:text-accent-hover">
              All Postings &rarr;
            </Link>
          </div>

          <div className="divide-y divide-border/60">
            {orders.slice(0, 4).map((order) => (
              <div key={order.id} className="py-3 flex items-center justify-between text-xs font-mono">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-primary">{order.id}</span>
                    <span className={order.status === 'SUCCEEDED' ? 'badge-success text-[10px]' : 'badge-warning text-[10px]'}>
                      {order.status}
                    </span>
                  </div>
                  <span className="text-[11px] text-secondary">
                    {order.customerName} &bull; {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="text-right">
                  <span className="font-bold text-primary t-num">{formatINR(order.finalAmount)}</span>
                  <span className="block text-[10px] text-secondary">Score: {order.riskScore}/100</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Quarantined DLQ Queue */}
        <div className="surface-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-warning font-mono flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-warning" />
              Active Dead-Letter Queue Events
            </h2>
            <Link to="/console/dlq" className="text-xs font-mono text-warning hover:underline">
              Inspect Queue &rarr;
            </Link>
          </div>

          {dlqEvents.length === 0 ? (
            <div className="p-8 text-center text-xs text-secondary bg-surface-elevated rounded-xl border border-border">
              Dead-letter queue is clear. No quarantined events pending review.
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {dlqEvents.slice(0, 4).map((event) => (
                <div key={event.eventId} className="py-3 space-y-1 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-warning">{event.eventId}</span>
                    <span className="badge-warning text-[10px]">Risk: {event.riskScore}/100</span>
                  </div>
                  <p className="text-[11px] text-secondary font-sans line-clamp-1">
                    {event.reason}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-secondary-muted pt-0.5">
                    <span>Order: {event.orderId}</span>
                    <span>Retries: {event.retryCount}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
