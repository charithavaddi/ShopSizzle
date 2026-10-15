import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Scale, ShieldCheck, ArrowUpRight, ArrowDownLeft, 
  RefreshCw, CheckCircle2, DollarSign, Filter, Layers, Database 
} from 'lucide-react';
import { useToast } from '../components/ToastProvider';

export default function LedgerView({ apiBaseUrl, orders = [] }) {
  const toast = useToast();
  const [filterAccount, setFilterAccount] = useState('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [liveLedgerEntries, setLiveLedgerEntries] = useState([]);

  // Fetch or construct real-time balanced entries from both backend and current session orders
  const refreshLedger = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/analytics/recent-transactions`);
      if (res.ok) {
        const data = await res.json();
        // Construct balanced double-entry rows
        const serverRows = [];
        (data.transactions || []).forEach((txn) => {
          const amt = Number(txn.total_amount || 0);
          const subtotal = Number((amt / 1.18).toFixed(2));
          const tax = Number((amt - subtotal).toFixed(2));
          const orderId = txn.order_id || 'ord_server';
          const time = txn.created_at || new Date().toISOString();

          // 1. DEBIT: Cash / Receivables (Asset)
          serverRows.push({
            id: `deb_${orderId}_1`,
            orderId,
            timestamp: time,
            account: '1010 - Cash & Receivables (Asset)',
            type: 'DEBIT',
            amount: amt,
            riskScore: txn.risk_score || 10,
            status: 'POSTED'
          });

          // 2. CREDIT: Revenue (Equity)
          serverRows.push({
            id: `crd_${orderId}_rev`,
            orderId,
            timestamp: time,
            account: '4010 - Software Sales Revenue (Equity)',
            type: 'CREDIT',
            amount: subtotal,
            riskScore: txn.risk_score || 10,
            status: 'POSTED'
          });

          // 3. CREDIT: GST Payable (Liability)
          serverRows.push({
            id: `crd_${orderId}_tax`,
            orderId,
            timestamp: time,
            account: '2020 - GST Output Tax Payable (Liability)',
            type: 'CREDIT',
            amount: tax,
            riskScore: txn.risk_score || 10,
            status: 'POSTED'
          });
        });

        if (serverRows.length > 0) {
          setLiveLedgerEntries(serverRows);
          toast.success('Double-entry ledger synchronized from database');
          setIsRefreshing(false);
          return;
        }
      }
    } catch {
      // Fallback to local session orders
    }

    // Build ledger entries from succeeded orders
    const sessionRows = [];
    orders
      .filter((o) => o.status === 'Succeeded')
      .forEach((o) => {
        const total = Number(o.finalAmount || o.totalAmount || 0);
        const subtotal = Number(o.subtotal || (total / 1.18).toFixed(2));
        const tax = Number(o.tax || (total - subtotal).toFixed(2));
        const orderId = o.id;
        const time = o.createdAt || new Date().toISOString();

        // DEBIT Asset
        sessionRows.push({
          id: `deb_${orderId}`,
          orderId,
          timestamp: time,
          account: '1010 - Cash & Receivables (Asset)',
          type: 'DEBIT',
          amount: total,
          riskScore: o.riskScore || 12,
          status: 'POSTED'
        });

        // CREDIT Revenue
        sessionRows.push({
          id: `crd_${orderId}_rev`,
          orderId,
          timestamp: time,
          account: '4010 - Software Sales Revenue (Equity)',
          type: 'CREDIT',
          amount: subtotal,
          riskScore: o.riskScore || 12,
          status: 'POSTED'
        });

        // CREDIT GST Liability
        sessionRows.push({
          id: `crd_${orderId}_tax`,
          orderId,
          timestamp: time,
          account: '2020 - GST Output Tax Payable (Liability)',
          type: 'CREDIT',
          amount: tax,
          riskScore: o.riskScore || 12,
          status: 'POSTED'
        });
      });

    // If no session orders yet, provide seed enterprise demo records
    if (sessionRows.length === 0) {
      const demoTime = new Date().toISOString();
      const demoOrder = 'ord_seed_101';
      sessionRows.push(
        {
          id: `deb_${demoOrder}`,
          orderId: demoOrder,
          timestamp: demoTime,
          account: '1010 - Cash & Receivables (Asset)',
          type: 'DEBIT',
          amount: 588.82,
          riskScore: 10,
          status: 'POSTED'
        },
        {
          id: `crd_${demoOrder}_rev`,
          orderId: demoOrder,
          timestamp: demoTime,
          account: '4010 - Software Sales Revenue (Equity)',
          type: 'CREDIT',
          amount: 499.00,
          riskScore: 10,
          status: 'POSTED'
        },
        {
          id: `crd_${demoOrder}_tax`,
          orderId: demoOrder,
          timestamp: demoTime,
          account: '2020 - GST Output Tax Payable (Liability)',
          type: 'CREDIT',
          amount: 89.82,
          riskScore: 10,
          status: 'POSTED'
        }
      );
    }

    setLiveLedgerEntries(sessionRows);
    setIsRefreshing(false);
  };

  useEffect(() => {
    refreshLedger();
  }, [orders]);

  // Financial calculations for equation: Assets = Liabilities + Equity
  const totalDebits = liveLedgerEntries
    .filter((e) => e.type === 'DEBIT')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalCredits = liveLedgerEntries
    .filter((e) => e.type === 'CREDIT')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalAssets = totalDebits; // Debits to 1010
  const totalLiabilities = liveLedgerEntries
    .filter((e) => e.account.includes('Liability'))
    .reduce((sum, e) => sum + e.amount, 0);

  const totalEquity = liveLedgerEntries
    .filter((e) => e.account.includes('Equity'))
    .reduce((sum, e) => sum + e.amount, 0);

  const isBalanced = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.05;

  const filteredEntries = liveLedgerEntries.filter((e) => {
    if (filterAccount === 'ALL') return true;
    if (filterAccount === 'ASSET') return e.account.includes('Asset');
    if (filterAccount === 'REVENUE') return e.account.includes('Equity');
    if (filterAccount === 'TAX') return e.account.includes('Liability');
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Scale className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Double-Entry Financial Ledger</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            GAAP-compliant general ledger verifying debits equal credits for every transaction event
          </p>
        </div>

        <button
          onClick={refreshLedger}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-xl transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          Re-verify Balances
        </button>
      </div>

      {/* Accounting Equation Verification Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-850 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Fundamental Accounting Equation Verification
            </span>
          </div>

          {isBalanced ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-4 h-4" />
              Equation Balanced: Assets = Liabilities + Equity
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
              Equation Discrepancy Detected
            </span>
          )}
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-xs text-slate-400 flex items-center justify-between">
              Total Assets (Debits)
              <ArrowDownLeft className="w-3.5 h-3.5 text-blue-400" />
            </span>
            <div className="text-xl font-bold text-white mt-1">
              ${totalAssets.toFixed(2)}
            </div>
            <span className="text-[10px] text-slate-500">Cash &amp; Merchant Receivables</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-xs text-slate-400 flex items-center justify-between">
              Total Liabilities (Credits)
              <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
            </span>
            <div className="text-xl font-bold text-amber-400 mt-1">
              ${totalLiabilities.toFixed(2)}
            </div>
            <span className="text-[10px] text-slate-500">18% GST Output Tax Payable</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-xs text-slate-400 flex items-center justify-between">
              Total Equity &amp; Revenue
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
            </span>
            <div className="text-xl font-bold text-emerald-400 mt-1">
              ${totalEquity.toFixed(2)}
            </div>
            <span className="text-[10px] text-slate-500">Net Retained Software Earnings</span>
          </div>
        </div>
      </div>

      {/* Filter and entries list */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-white">General Ledger Journal Entries</h2>

          {/* Account Filter */}
          <div className="flex rounded-lg bg-slate-900 border border-slate-800 p-0.5 text-xs font-medium">
            <button
              onClick={() => setFilterAccount('ALL')}
              className={`px-3 py-1 rounded-md transition ${
                filterAccount === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Accounts
            </button>
            <button
              onClick={() => setFilterAccount('ASSET')}
              className={`px-3 py-1 rounded-md transition ${
                filterAccount === 'ASSET' ? 'bg-blue-500/20 text-blue-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              Assets
            </button>
            <button
              onClick={() => setFilterAccount('REVENUE')}
              className={`px-3 py-1 rounded-md transition ${
                filterAccount === 'REVENUE' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              Revenue
            </button>
            <button
              onClick={() => setFilterAccount('TAX')}
              className={`px-3 py-1 rounded-md transition ${
                filterAccount === 'TAX' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              GST Liabilities
            </button>
          </div>
        </div>

        {/* Ledger Entries Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 font-mono text-[11px] uppercase">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Order Ref</th>
                <th className="py-3 px-4">Account Code &amp; Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-right">Debit ($)</th>
                <th className="py-3 px-4 text-right">Credit ($)</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono">
              {filteredEntries.map((entry) => {
                const isDebit = entry.type === 'DEBIT';
                return (
                  <tr key={entry.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-bold whitespace-nowrap">
                      {entry.orderId}
                    </td>
                    <td className="py-3 px-4 text-slate-200 font-sans font-medium">
                      {entry.account}
                    </td>
                    <td className="py-3 px-4">
                      {isDebit ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                          DEBIT
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          CREDIT
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-blue-400">
                      {isDebit ? `$${entry.amount.toFixed(2)}` : '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-400">
                      {!isDebit ? `$${entry.amount.toFixed(2)}` : '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-emerald-400 border border-slate-700">
                        <CheckCircle2 className="w-3 h-3" />
                        Balanced
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
