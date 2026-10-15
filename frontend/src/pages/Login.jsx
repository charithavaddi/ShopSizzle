import React, { useState } from 'react';
import { KeyRound, Shield, User, Lock, CheckCircle2, AlertCircle, Copy } from 'lucide-react';

export default function Login({ apiBaseUrl = 'http://localhost:5000' }) {
  const [email, setEmail] = useState('admin@fincommerce.io');
  const [password, setPassword] = useState('FinAdmin@2026!');
  const [fullName, setFullName] = useState('Security Officer');
  const [role, setRole] = useState('ADMIN');
  const [isRegister, setIsRegister] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authResponse, setAuthResponse] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setAuthResponse(null);

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const payload = isRegister 
      ? { email, password, fullName, role }
      : { email, password };

    try {
      const res = await fetch(`${apiBaseUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Authentication failed');
      }

      setAuthResponse(data);
      if (data.token) {
        localStorage.setItem('fincommerce_token', data.token);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Auth Card */}
      <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {isRegister ? 'Register Merchant Account' : 'Security & JWT Authentication'}
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Role-Based Access Control (RBAC): ADMIN, FINANCE_ADMIN, CUSTOMER
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => { setIsRegister(!isRegister); setError(null); }}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 font-mono"
          >
            {isRegister ? 'Switch to Login' : 'Switch to Register'}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Full Name</label>
              <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-2.5 rounded-lg border border-slate-800">
                <User className="w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-transparent text-xs text-white flex-1 focus:outline-none"
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Email Address</label>
            <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-2.5 rounded-lg border border-slate-800">
              <User className="w-4 h-4 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent text-xs text-white flex-1 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Password</label>
            <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-2.5 rounded-lg border border-slate-800">
              <Lock className="w-4 h-4 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-transparent text-xs text-white flex-1 focus:outline-none"
                required
              />
            </div>
          </div>

          {isRegister && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Role Authority</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-slate-950 text-xs text-slate-200 px-3.5 py-2.5 rounded-lg border border-slate-800 focus:outline-none"
              >
                <option value="ADMIN">ADMIN (Full DLQ Purge & Replay Access)</option>
                <option value="FINANCE_ADMIN">FINANCE_ADMIN (Ledger Auditor)</option>
                <option value="CUSTOMER">CUSTOMER (Standard User)</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            <Shield className="w-4 h-4" />
            {isLoading ? 'Authenticating with Secret...' : (isRegister ? 'Register & Generate JWT' : 'Authenticate & Issue JWT')}
          </button>
        </form>

        {error && (
          <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-lg text-xs font-mono text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {authResponse && (
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between text-emerald-400 font-bold border-b border-slate-800 pb-2">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> JWT Issued Successfully
              </span>
              <span className="text-[10px] text-slate-400">Expires in 24h</span>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 text-[10px]">Bearer Token:</span>
              <div className="flex items-center gap-2 bg-slate-900 p-2.5 rounded border border-slate-800 overflow-x-auto text-[11px] text-emerald-300">
                <span className="truncate flex-1">{authResponse.token}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(authResponse.token)}
                  className="text-slate-500 hover:text-white"
                  title="Copy Token"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <pre className="text-slate-300 text-[11px] bg-slate-900 p-3 rounded border border-slate-800">
              {JSON.stringify({ user: authResponse.user }, null, 2)}
            </pre>
          </div>
        )}

      </div>

    </div>
  );
}
