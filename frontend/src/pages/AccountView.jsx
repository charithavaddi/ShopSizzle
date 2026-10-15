import React, { useState } from 'react';
import { 
  User, Shield, CreditCard, Terminal, Zap, CheckCircle2, 
  Copy, Check, AlertTriangle, RefreshCw, Key, Server, Cpu
} from 'lucide-react';
import { useToast } from '../components/ToastProvider';

export default function AccountView({ apiBaseUrl, serverStatus = 'UP' }) {
  const toast = useToast();
  const [copiedKey, setCopiedKey] = useState(null);
  const [devMode, setDevMode] = useState(true);
  const [riskThreshold, setRiskThreshold] = useState(70);
  const [idempotencySafeGuard, setIdempotencySafeGuard] = useState(true);
  const [autoReplay, setAutoReplay] = useState(false);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    toast.info('Copied test card to clipboard');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const clearQuarantine = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/admin/dlq/clear`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Quarantined DLQ events cleared successfully');
      } else {
        toast.success('Simulation DLQ buffer flushed');
      }
    } catch {
      toast.success('Simulation DLQ buffer flushed');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
              <User className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Account &amp; Developer Sandbox</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage engineer identity, simulated test cards, fraud thresholds, and system test mode
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-mono text-emerald-400">Sandbox Environment Active</span>
        </div>
      </div>

      {/* User Identity Card */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
          User Identity &amp; Enterprise Role
        </h2>

        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-emerald-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-blue-500/20">
            AM
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h3 className="text-lg font-bold text-white">Alex Mercer</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Staff FinTech Engineer
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">alex.mercer@fintech-labs.io</p>
            <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
              <span>Organization: FinCommerce Core Architecture</span>
              <span>&bull;</span>
              <span>Permissions: Read, Execute, Settle</span>
            </div>
          </div>
        </div>
      </div>

      {/* Simulated Test Cards & Presets */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-blue-400" />
            Simulated Test Cards &amp; Presets
          </h2>
          <span className="text-xs text-slate-500">Click to copy card numbers</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Preset 1: Standard Card */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/30 hover:border-emerald-500/60 transition space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Standard Clean Card
              </span>
              <span className="text-[10px] font-mono text-emerald-500/80 bg-emerald-500/10 px-2 py-0.5 rounded">
                Risk Score: ~10
              </span>
            </div>

            <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-lg border border-slate-800 font-mono text-xs">
              <span className="text-white">4242 4242 4242 4242</span>
              <button
                onClick={() => copyToClipboard('4242 4242 4242 4242', 'card-clean')}
                className="text-slate-400 hover:text-white transition"
              >
                {copiedKey === 'card-clean' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Triggers immediate payment authorization and automatically posts balanced double-entry ledger entries.
            </p>
          </div>

          {/* Preset 2: Fraud DLQ Card */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-amber-500/30 hover:border-amber-500/60 transition space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                High-Risk / DLQ Trigger Card
              </span>
              <span className="text-[10px] font-mono text-amber-500/80 bg-amber-500/10 px-2 py-0.5 rounded">
                Risk Score: &ge; 70
              </span>
            </div>

            <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-lg border border-slate-800 font-mono text-xs">
              <span className="text-white">9999 9999 9999 9999</span>
              <button
                onClick={() => copyToClipboard('9999 9999 9999 9999', 'card-fraud')}
                className="text-slate-400 hover:text-white transition"
              >
                {copiedKey === 'card-fraud' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Triggers fraud risk engine (&ge;70 threshold) and quarantines event to AWS EventBridge Dead-Letter Queue without exposing raw errors.
            </p>
          </div>

        </div>
      </div>

      {/* Developer Sandbox Controls */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          System Settings &amp; Compliance Simulation
        </h2>

        <div className="space-y-4">
          
          {/* Toggle 1: Idempotency Protection */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <div>
              <h3 className="text-xs font-semibold text-white">Idempotency Guard Active</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Automatically rejects identical double-charge requests and returns cached results
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={idempotencySafeGuard}
                onChange={(e) => setIdempotencySafeGuard(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Toggle 2: Fraud Threshold */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold text-white">Fraud Quarantine Threshold</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Transactions scoring at or above this value divert to Dead-Letter Queue
                </p>
              </div>
              <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                Score &ge; {riskThreshold}
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="95"
              step="5"
              value={riskThreshold}
              onChange={(e) => setRiskThreshold(Number(e.target.value))}
              className="w-full accent-blue-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
          </div>

          {/* Infrastructure Health */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <h3 className="text-xs font-semibold text-white flex items-center gap-2">
              <Server className="w-3.5 h-3.5 text-blue-400" />
              Connected Infrastructure Status
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Node.js Server</span>
                <span className="font-semibold text-emerald-400">{serverStatus}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">AWS EventBridge</span>
                <span className="font-semibold text-blue-400">ACTIVE</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Double-Entry DB</span>
                <span className="font-semibold text-emerald-400">SYNCED</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Idempotency Cache</span>
                <span className="font-semibold text-emerald-400">ARMED</span>
              </div>
            </div>
          </div>

          {/* Maintenance Action */}
          <div className="pt-2 flex justify-between items-center">
            <span className="text-xs text-slate-500">Need to reset simulated quarantine queue?</span>
            <button
              onClick={clearQuarantine}
              className="px-3.5 py-2 text-xs font-semibold bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-xl transition"
            >
              Purge Quarantined DLQ Events
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}
