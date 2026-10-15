import React from 'react';
import { NavLink, Link, Outlet } from 'react-router-dom';
import { 
  Activity, BookOpen, AlertOctagon, Network, ArrowLeft, 
  Terminal, ShieldCheck, Database, CheckCircle2 
} from 'lucide-react';
import { useOps } from '../context/OpsContext';

export default function ConsoleLayout() {
  const { dlqEvents, backendStatus } = useOps();
  const quarantinedCount = dlqEvents.filter((e) => e.queueStatus === 'QUARANTINED').length;

  const navItems = [
    { to: '/console', label: 'Overview', icon: Activity, exact: true },
    { to: '/console/ledger', label: 'Ledger & Accounting', icon: BookOpen },
    { 
      to: '/console/dlq', 
      label: 'Fraud & DLQ', 
      icon: AlertOctagon, 
      badge: quarantinedCount > 0 ? quarantinedCount : null 
    },
    { to: '/console/aws-architecture', label: 'AWS Architecture', icon: Network },
  ];

  return (
    <div className="min-h-screen bg-app text-primary flex flex-col font-sans selection:bg-accent/20 selection:text-primary">
      {/* Console Top Header */}
      <header className="sticky top-0 z-40 bg-surface border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            
            {/* Title & Brand */}
            <div className="flex items-center gap-3">
              <Link to="/console" className="flex items-center gap-2 text-primary font-bold text-sm tracking-tight">
                <Terminal className="w-4 h-4 text-accent" />
                <span>FinCommerce Console</span>
              </Link>
              <span className="text-secondary/40 font-mono text-xs">/</span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono bg-surface-elevated border border-border text-secondary">
                <span className={`w-1.5 h-1.5 rounded-full ${backendStatus === 'ONLINE' ? 'bg-success animate-pulse' : 'bg-warning'}`} />
                <span>{backendStatus === 'ONLINE' ? 'Backend Live' : 'Simulation Mode'}</span>
              </div>
            </div>

            {/* Return to Store CTA */}
            <div>
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-secondary hover:text-primary hover:bg-surface-elevated transition-colors border border-border"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Store</span>
              </Link>
            </div>

          </div>

          {/* Console Tab Navigation */}
          <nav className="flex items-center gap-1 -mb-px overflow-x-auto scrollbar-none py-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.exact}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                      isActive
                        ? 'border-accent text-accent font-semibold'
                        : 'border-transparent text-secondary hover:text-primary hover:border-border'
                    }`
                  }
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-error/20 text-error border border-error/30">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Console Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Outlet />
      </main>

      {/* Compact Console Footer */}
      <footer className="border-t border-border bg-surface/50 text-[11px] font-mono text-secondary py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span>FinCommerce Financial Engine</span>
            <span>&bull;</span>
            <span>Double-Entry Balance: Strict</span>
            <span>&bull;</span>
            <span>Risk Threshold: &ge; 70 Quarantine</span>
          </div>
          <div className="text-secondary-muted">
            Internal Operations &bull; Least-Privilege Console
          </div>
        </div>
      </footer>
    </div>
  );
}
