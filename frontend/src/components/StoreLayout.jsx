import React from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { ShoppingCart, ShieldCheck, Cpu, Terminal, ArrowUpRight, Search, Menu, X } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function StoreLayout() {
  const { totalCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-app text-primary flex flex-col font-sans selection:bg-accent/20 selection:text-primary">
      {/* Top Banner / Store Header */}
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-lg bg-surface-elevated border border-border flex items-center justify-center text-accent group-hover:border-accent/40 transition-colors">
                <Cpu className="w-4 h-4" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-bold text-base tracking-tight text-primary">FinCommerce</span>
                <span className="text-[11px] font-mono text-secondary hidden sm:inline">hardware</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    isActive ? 'text-primary bg-surface-elevated border border-border' : 'text-secondary hover:text-primary'
                  }`
                }
              >
                Shop
              </NavLink>
              <NavLink
                to="/orders"
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    isActive ? 'text-primary bg-surface-elevated border border-border' : 'text-secondary hover:text-primary'
                  }`
                }
              >
                Orders
              </NavLink>
              <Link
                to="/console"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium text-secondary hover:text-accent hover:bg-surface-elevated transition-colors border border-transparent hover:border-border"
              >
                <Terminal className="w-3.5 h-3.5 text-accent" />
                <span>Infrastructure Console</span>
                <ArrowUpRight className="w-3 h-3 opacity-60" />
              </Link>
            </nav>

            {/* Actions: Cart */}
            <div className="flex items-center gap-3">
              <Link
                to="/cart"
                className="relative inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-elevated hover:bg-surface-elevated/80 border border-border text-xs font-medium text-primary transition-colors"
                aria-label={`Shopping cart with ${totalCount} items`}
              >
                <ShoppingCart className="w-4 h-4 text-secondary" />
                <span className="hidden sm:inline">Cart</span>
                {totalCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold bg-accent text-app">
                    {totalCount}
                  </span>
                )}
              </Link>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-surface-elevated"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-surface px-4 py-3 space-y-2">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-secondary hover:text-primary hover:bg-surface-elevated"
            >
              Shop Hardware
            </Link>
            <Link
              to="/orders"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-secondary hover:text-primary hover:bg-surface-elevated"
            >
              Order History
            </Link>
            <Link
              to="/console"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-accent hover:bg-surface-elevated"
            >
              Infrastructure Console &rarr;
            </Link>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <Outlet />
      </main>

      {/* Store Footer */}
      <footer className="border-t border-border bg-surface text-xs text-secondary mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-accent" />
                <span className="font-bold text-sm text-primary">FinCommerce</span>
              </div>
              <p className="text-secondary-muted text-xs leading-relaxed">
                Premium electronics hardware built around verified financial infrastructure, idempotent payments, and double-entry accounting.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">Hardware Catalog</h4>
              <ul className="space-y-2">
                <li><Link to="/?category=laptops" className="hover:text-primary transition-colors">Laptops &amp; Ultrabooks</Link></li>
                <li><Link to="/?category=audio" className="hover:text-primary transition-colors">Wireless &amp; Audiophile Audio</Link></li>
                <li><Link to="/?category=processors" className="hover:text-primary transition-colors">Desktop Processors</Link></li>
                <li><Link to="/?category=graphics" className="hover:text-primary transition-colors">Graphics Cards</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">Financial Infrastructure</h4>
              <ul className="space-y-2">
                <li><Link to="/console" className="hover:text-primary transition-colors">Operations Overview</Link></li>
                <li><Link to="/console/ledger" className="hover:text-primary transition-colors">Double-Entry Ledger</Link></li>
                <li><Link to="/console/dlq" className="hover:text-primary transition-colors">Fraud Quarantine &amp; DLQ</Link></li>
                <li><Link to="/console/aws-architecture" className="hover:text-primary transition-colors">AWS Architecture Guide</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">Transaction Guarantees</h4>
              <div className="space-y-2 text-secondary-muted">
                <div className="flex items-center gap-1.5 text-success">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span className="text-xs">Idempotency Guard Active</span>
                </div>
                <p className="text-[11px]">
                  All payments use deterministic idempotency keys and double-entry ledger verification.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-mono text-secondary-muted">
            <p>&copy; {new Date().getFullYear()} FinCommerce Financial Platform. Demonstrating reliable distributed commerce.</p>
            <div className="flex items-center gap-4">
              <span>GST 18% Compliant</span>
              <span>&bull;</span>
              <span>Amazon EventBridge + SQS DLQ</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
