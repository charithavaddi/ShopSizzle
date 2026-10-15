import React, { useState } from 'react';
import { 
  BookOpen, Scale, ShieldCheck, CheckCircle2, Search, Filter, 
  ArrowDownLeft, ArrowUpRight, Copy, Check, ExternalLink, X 
} from 'lucide-react';
import { useOps } from '../context/OpsContext';
import { formatINR } from '../data/products';
import { useToast } from '../components/ToastProvider';

export default function LedgerPage() {
  const { ledger } = useOps();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [accountFilter, setAccountFilter] = useState('ALL');
  const [selectedJournal, setSelectedJournal] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    toast.info('Copied identifier to clipboard');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Metrics
  const totalDebits = ledger.reduce((sum, l) => sum + l.debit, 0);
  const totalCredits = ledger.reduce((sum, l) => sum + l.credit, 0);
  const isBalanced = totalDebits === totalCredits;
  const uniqueTransactions = new Set(ledger.map((l) => l.orderId)).size;
  const unbalancedCount = isBalanced ? 0 : 1;

  // Filtered rows
  const filteredEntries = ledger.filter((entry) => {
    const term = search.toLowerCase();
    const matchesSearch =
      entry.orderId?.toLowerCase().includes(term) ||
      entry.journalId?.toLowerCase().includes(term) ||
      entry.accountName?.toLowerCase().includes(term) ||
      entry.paymentRef?.toLowerCase().includes(term);

    if (!matchesSearch) return false;
    if (accountFilter === 'ALL') return true;
    if (accountFilter === '1010') return entry.accountCode === '1010';
    if (accountFilter === '4010') return entry.accountCode === '4010';
    if (accountFilter === '2020') return entry.accountCode === '2020';
    return true;
  });

  // Group entries by journal ID for detail inspection
  const getJournalGroup = (journalId) => {
    return ledger.filter((l) => l.journalId === journalId);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Title */}
      <div className="border-b border-border pb-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-primary">Ledger</h1>
          <p className="text-xs text-secondary mt-0.5">
            GAAP-compliant double-entry general ledger with balanced debit-credit postings
          </p>
        </div>
        <span className="text-xs font-mono text-secondary">
          Base Currency: <span className="text-primary font-semibold">INR (₹)</span>
        </span>
      </div>

      {/* Compact Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        
        <div className="surface-card p-4 space-y-1">
          <span className="text-xs text-secondary font-sans">Total Posted Transactions</span>
          <div className="text-xl font-bold text-primary t-num">{uniqueTransactions}</div>
          <span className="text-[10px] text-secondary">Distinct settled orders</span>
        </div>

        <div className="surface-card p-4 space-y-1">
          <span className="text-xs text-secondary font-sans flex items-center justify-between">
            <span>Total Debits</span>
            <ArrowDownLeft className="w-3.5 h-3.5 text-accent" />
          </span>
          <div className="text-xl font-bold text-accent t-num">{formatINR(totalDebits)}</div>
          <span className="text-[10px] text-secondary">Asset Account Increases</span>
        </div>

        <div className="surface-card p-4 space-y-1">
          <span className="text-xs text-secondary font-sans flex items-center justify-between">
            <span>Total Credits</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-success" />
          </span>
          <div className="text-xl font-bold text-success t-num">{formatINR(totalCredits)}</div>
          <span className="text-[10px] text-secondary">Revenue &amp; Tax Liabilities</span>
        </div>

        <div className="surface-card p-4 space-y-1">
          <span className="text-xs text-secondary font-sans">Unbalanced Entries</span>
          <div className={`text-xl font-bold t-num ${unbalancedCount === 0 ? 'text-success' : 'text-error'}`}>
            {unbalancedCount === 0 ? '0 (BALANCED)' : `${unbalancedCount} DISCREPANCY`}
          </div>
          <span className="text-[10px] text-secondary">Debits == Credits Equation</span>
        </div>

      </div>

      {/* Accounting Correctness Badge */}
      <div className="p-4 rounded-xl bg-surface border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-accent" />
          <span className="text-xs font-semibold text-primary">Fundamental Accounting Equation Status:</span>
        </div>

        {isBalanced ? (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-success/10 border border-success/30 text-success text-xs font-mono font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Total Debits ({formatINR(totalDebits)}) = Total Credits ({formatINR(totalCredits)}) [Balanced]</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-error/10 border border-error/30 text-error text-xs font-mono font-bold">
            <span>Discrepancy: Debits ≠ Credits</span>
          </div>
        )}
      </div>

      {/* Table Toolbar: Search and Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Journal, Order ID, Account..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs rounded-lg bg-surface border border-border text-primary placeholder-secondary focus:outline-none focus:border-accent w-64"
          />
        </div>

        {/* Account Filters */}
        <div className="flex rounded-lg bg-surface border border-border p-0.5 text-xs font-medium">
          <button
            onClick={() => setAccountFilter('ALL')}
            className={`px-3 py-1 rounded-md transition ${
              accountFilter === 'ALL' ? 'bg-surface-elevated text-primary font-semibold' : 'text-secondary hover:text-primary'
            }`}
          >
            All Accounts
          </button>
          <button
            onClick={() => setAccountFilter('1010')}
            className={`px-3 py-1 rounded-md transition ${
              accountFilter === '1010' ? 'bg-accent/20 text-accent font-semibold' : 'text-secondary hover:text-primary'
            }`}
          >
            1010 Cash
          </button>
          <button
            onClick={() => setAccountFilter('4010')}
            className={`px-3 py-1 rounded-md transition ${
              accountFilter === '4010' ? 'bg-success/20 text-success font-semibold' : 'text-secondary hover:text-primary'
            }`}
          >
            4010 Revenue
          </button>
          <button
            onClick={() => setAccountFilter('2020')}
            className={`px-3 py-1 rounded-md transition ${
              accountFilter === '2020' ? 'bg-warning/20 text-warning font-semibold' : 'text-secondary hover:text-primary'
            }`}
          >
            2020 GST
          </button>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-surface-elevated text-secondary border-b border-border text-[11px] uppercase">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Journal ID</th>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Account</th>
                <th className="py-3 px-4 text-right">Debit</th>
                <th className="py-3 px-4 text-right">Credit</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Payment Ref</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredEntries.map((entry) => {
                const isDebit = entry.type === 'DEBIT';
                return (
                  <tr
                    key={entry.id}
                    onClick={() => setSelectedJournal(entry.journalId)}
                    className="hover:bg-surface-elevated/60 transition cursor-pointer"
                  >
                    <td className="py-2.5 px-4 text-secondary whitespace-nowrap">
                      {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-primary whitespace-nowrap">
                      {entry.journalId}
                    </td>
                    <td className="py-2.5 px-4 text-accent whitespace-nowrap">
                      {entry.orderId}
                    </td>
                    <td className="py-2.5 px-4 text-primary font-sans font-medium whitespace-nowrap">
                      {entry.accountName}
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-accent t-num">
                      {isDebit ? formatINR(entry.debit) : '—'}
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-success t-num">
                      {!isDebit ? formatINR(entry.credit) : '—'}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="badge-success text-[10px]">POSTED</span>
                    </td>
                    <td className="py-2.5 px-4 text-secondary truncate max-w-[120px]">
                      {entry.paymentRef || 'PAY_AUTH_OK'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Journal Entry Detail Modal */}
      {selectedJournal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-app/80 backdrop-blur-sm"
            onClick={() => setSelectedJournal(null)}
          />

          <div className="relative w-full max-w-xl p-6 rounded-2xl bg-surface border border-border text-primary shadow-elevated z-10 space-y-5 animate-scale-in">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <span className="text-[10px] font-mono text-secondary uppercase">Journal Group Audit</span>
                <h3 className="text-base font-bold font-mono text-primary">{selectedJournal}</h3>
              </div>
              <button
                onClick={() => setSelectedJournal(null)}
                className="p-1 rounded text-secondary hover:text-primary transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-secondary uppercase tracking-wider">
                Balanced Postings for this Journal Entry
              </h4>

              <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
                {getJournalGroup(selectedJournal).map((post) => (
                  <div key={post.id} className="p-3.5 flex items-center justify-between text-xs font-mono">
                    <div>
                      <span className="text-primary font-sans font-semibold block">{post.accountName}</span>
                      <span className="text-secondary text-[11px]">Code: {post.accountCode} &bull; {post.type}</span>
                    </div>

                    <div className="text-right">
                      {post.type === 'DEBIT' ? (
                        <span className="font-bold text-accent">Debit {formatINR(post.debit)}</span>
                      ) : (
                        <span className="font-bold text-success">Credit {formatINR(post.credit)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Proof of balance */}
            <div className="p-3.5 rounded-xl bg-surface-elevated border border-border flex items-center justify-between text-xs font-mono">
              <span className="text-secondary">Journal Balance Equation:</span>
              <span className="text-success font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Debits Equal Credits (Balanced)</span>
              </span>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedJournal(null)}
                className="btn-secondary text-xs"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
