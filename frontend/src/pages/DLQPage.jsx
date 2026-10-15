import React, { useState } from 'react';
import { 
  AlertOctagon, Clock, RefreshCw, Trash2, CheckCircle2, 
  ShieldAlert, Eye, X, ArrowRight, ShieldCheck, Terminal, HelpCircle 
} from 'lucide-react';
import { useOps } from '../context/OpsContext';
import { useToast } from '../components/ToastProvider';
import { formatINR } from '../data/products';

export default function DLQPage() {
  const { dlqEvents, retryDLQEvent, purgeDLQ, backendStatus } = useOps();
  const toast = useToast();
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isRetrying, setIsRetrying] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Metrics
  const quarantinedCount = dlqEvents.filter((e) => e.queueStatus === 'QUARANTINED').length;
  const reprocessedCount = dlqEvents.filter((e) => e.queueStatus === 'REPROCESSED_SUCCESS').length;
  const totalAttempts = dlqEvents.reduce((sum, e) => sum + e.retryCount, 0);

  const handleRetry = async (eventId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Confirm redrive: Replay this quarantined event into the double-entry financial ledger? Idempotency guarantees no double charge.')) {
      return;
    }

    setIsRetrying(eventId);
    try {
      await retryDLQEvent(eventId);
      toast.success(`Event ${eventId} successfully released from DLQ and posted to ledger.`);
      toast.info('Ledger verified: Balanced transaction recorded', 4000);
      if (selectedEvent?.eventId === eventId) {
        setSelectedEvent((prev) => ({ ...prev, queueStatus: 'REPROCESSED_SUCCESS', retryCount: prev.retryCount + 1 }));
      }
    } catch {
      toast.error('Failed to redrive event');
    } finally {
      setIsRetrying(null);
    }
  };

  const handlePurge = async () => {
    if (!window.confirm('Purge all quarantined events from the Dead-Letter Queue buffer?')) {
      return;
    }
    await purgeDLQ();
    toast.success('Quarantined DLQ buffer purged');
  };

  const filteredEvents = dlqEvents.filter((e) => {
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'QUARANTINED') return e.queueStatus === 'QUARANTINED';
    if (filterStatus === 'REPROCESSED') return e.queueStatus === 'REPROCESSED_SUCCESS';
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title Header */}
      <div className="border-b border-border pb-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-primary">Fraud Quarantine &amp; Dead-Letter Queue</h1>
          <p className="text-xs text-secondary mt-0.5">
            Operational review console for high-risk transactions (&ge;70 risk score) and asynchronous SQS DLQ redrive
          </p>
        </div>

        <div className="flex items-center gap-3">
          {dlqEvents.length > 0 && (
            <button
              onClick={handlePurge}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-error/15 hover:bg-error/25 text-error border border-error/30 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Purge DLQ Buffer</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className="surface-card p-4 space-y-1">
          <span className="text-xs text-secondary font-sans">Events Awaiting Review</span>
          <div className="text-xl font-bold text-warning t-num">{quarantinedCount}</div>
          <span className="text-[10px] text-secondary">Risk threshold &ge; 70</span>
        </div>

        <div className="surface-card p-4 space-y-1">
          <span className="text-xs text-secondary font-sans">Quarantined Transactions</span>
          <div className="text-xl font-bold text-primary t-num">{dlqEvents.length}</div>
          <span className="text-[10px] text-secondary">Total DLQ events logged</span>
        </div>

        <div className="surface-card p-4 space-y-1">
          <span className="text-xs text-secondary font-sans">Successfully Reprocessed</span>
          <div className="text-xl font-bold text-success t-num">{reprocessedCount}</div>
          <span className="text-[10px] text-secondary">Settled after redrive</span>
        </div>

        <div className="surface-card p-4 space-y-1">
          <span className="text-xs text-secondary font-sans">Processing Redrive Attempts</span>
          <div className="text-xl font-bold text-accent t-num">{totalAttempts}</div>
          <span className="text-[10px] text-secondary">Controlled redrive executions</span>
        </div>
      </div>

      {/* Risk Policy Explanation Banner */}
      <div className="surface-card p-4 bg-surface-elevated flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-warning flex-shrink-0" />
          <div className="space-y-0.5">
            <span className="font-semibold text-primary">AWS EventBridge &amp; SQS DLQ Quarantine Policy:</span>
            <p className="text-secondary text-[11px]">
              Transactions scoring &lt; 70 proceed to normal processing. Transactions scoring &ge; 70 route to quarantine.
              Retrying an event preserves idempotency and does not create duplicate financial charges.
            </p>
          </div>
        </div>

        {/* Filter buttons */}
        <div className="flex rounded-lg bg-surface border border-border p-0.5 text-xs font-medium flex-shrink-0">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-2.5 py-1 rounded-md transition ${
              filterStatus === 'ALL' ? 'bg-surface-elevated text-primary font-semibold' : 'text-secondary hover:text-primary'
            }`}
          >
            All ({dlqEvents.length})
          </button>
          <button
            onClick={() => setFilterStatus('QUARANTINED')}
            className={`px-2.5 py-1 rounded-md transition ${
              filterStatus === 'QUARANTINED' ? 'bg-warning/20 text-warning font-semibold' : 'text-secondary hover:text-primary'
            }`}
          >
            Quarantined
          </button>
          <button
            onClick={() => setFilterStatus('REPROCESSED')}
            className={`px-2.5 py-1 rounded-md transition ${
              filterStatus === 'REPROCESSED' ? 'bg-success/20 text-success font-semibold' : 'text-secondary hover:text-primary'
            }`}
          >
            Reprocessed
          </button>
        </div>
      </div>

      {/* Queue Table */}
      <div className="surface-card overflow-hidden">
        {filteredEvents.length === 0 ? (
          <div className="p-12 text-center text-xs text-secondary">
            No events found matching current queue filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="bg-surface-elevated text-secondary border-b border-border text-[11px] uppercase">
                  <th className="py-3 px-4">Event ID</th>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Received</th>
                  <th className="py-3 px-4 text-center">Risk Score</th>
                  <th className="py-3 px-4">Reason / Failure Summary</th>
                  <th className="py-3 px-4 text-center">Retries</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredEvents.map((event) => {
                  const isQuarantined = event.queueStatus === 'QUARANTINED';
                  return (
                    <tr
                      key={event.eventId}
                      onClick={() => setSelectedEvent(event)}
                      className="hover:bg-surface-elevated/60 transition cursor-pointer"
                    >
                      <td className="py-3 px-4 font-bold text-warning whitespace-nowrap">
                        {event.eventId}
                      </td>
                      <td className="py-3 px-4 text-primary whitespace-nowrap">
                        {event.orderId}
                      </td>
                      <td className="py-3 px-4 text-secondary whitespace-nowrap">
                        {new Date(event.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          event.riskScore >= 70 ? 'bg-error/20 text-error' : 'bg-warning/20 text-warning'
                        }`}>
                          {event.riskScore}/100
                        </span>
                      </td>
                      <td className="py-3 px-4 text-secondary font-sans max-w-xs truncate">
                        {event.reason}
                      </td>
                      <td className="py-3 px-4 text-center text-secondary">
                        {event.retryCount}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isQuarantined ? (
                          <span className="badge-warning text-[10px]">QUARANTINED</span>
                        ) : (
                          <span className="badge-success text-[10px]">REPROCESSED</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isQuarantined ? (
                          <button
                            onClick={(e) => handleRetry(event.eventId, e)}
                            disabled={isRetrying === event.eventId}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-accent text-app hover:bg-accent-hover transition"
                          >
                            <RefreshCw className={`w-3 h-3 ${isRetrying === event.eventId ? 'animate-spin' : ''}`} />
                            <span>Redrive</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-success font-semibold">Settled</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-app/80 backdrop-blur-sm"
            onClick={() => setSelectedEvent(null)}
          />

          <div className="relative w-full max-w-2xl p-6 rounded-2xl bg-surface border border-border text-primary shadow-elevated z-10 space-y-5 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <span className="text-[10px] font-mono text-warning uppercase">SQS Dead-Letter Queue Event Detail</span>
                <h3 className="text-base font-bold font-mono text-primary">{selectedEvent.eventId}</h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1 rounded text-secondary hover:text-primary transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Risk & Queue status summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono bg-surface-elevated p-3.5 rounded-xl border border-border">
              <div>
                <span className="text-secondary block">Queue Status</span>
                <span className={selectedEvent.queueStatus === 'QUARANTINED' ? 'text-warning font-bold' : 'text-success font-bold'}>
                  {selectedEvent.queueStatus}
                </span>
              </div>
              <div>
                <span className="text-secondary block">Risk Score</span>
                <span className="text-error font-bold">{selectedEvent.riskScore} / 100</span>
              </div>
              <div>
                <span className="text-secondary block">Associated Order</span>
                <span className="text-primary font-semibold truncate block">{selectedEvent.orderId}</span>
              </div>
              <div>
                <span className="text-secondary block">Retry Attempts</span>
                <span className="text-primary">{selectedEvent.retryCount}</span>
              </div>
            </div>

            {/* Triggered Rules */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-secondary uppercase tracking-wider">
                Risk Engine Rules Triggered
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {selectedEvent.triggeredRules?.map((rule, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded text-[11px] font-mono bg-warning/15 text-warning border border-warning/30">
                    {rule}
                  </span>
                ))}
              </div>
            </div>

            {/* Sanitized Error Summary */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-secondary uppercase tracking-wider">
                Sanitized Operational Diagnostic
              </h4>
              <div className="p-3 rounded-lg bg-app border border-border text-xs font-mono text-secondary-muted">
                {selectedEvent.errorSummary || selectedEvent.reason}
              </div>
            </div>

            {/* Sanitized Event Payload */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-secondary uppercase tracking-wider">
                Event Detail Payload
              </h4>
              <pre className="p-3.5 rounded-lg bg-app border border-border text-[11px] font-mono text-primary overflow-x-auto">
                {JSON.stringify(selectedEvent.payload, null, 2)}
              </pre>
            </div>

            {/* Queue ARN references */}
            <div className="text-[10px] font-mono text-secondary space-y-1 border-t border-border/80 pt-3">
              <div>Source Queue: <span className="text-primary">{selectedEvent.sourceQueue}</span></div>
              <div>Dead-Letter Queue: <span className="text-warning">{selectedEvent.dlqArn}</span></div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-[11px] text-secondary font-mono">
                Reprocessing preserves idempotency
              </span>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="btn-secondary text-xs"
                >
                  Close
                </button>

                {selectedEvent.queueStatus === 'QUARANTINED' && (
                  <button
                    onClick={() => handleRetry(selectedEvent.eventId)}
                    disabled={isRetrying === selectedEvent.eventId}
                    className="btn-primary text-xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRetrying === selectedEvent.eventId ? 'animate-spin' : ''}`} />
                    <span>Redrive Event to Ledger</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
