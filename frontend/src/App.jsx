import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { OpsProvider } from './context/OpsContext';

// Layouts
import StoreLayout from './components/StoreLayout';
import ConsoleLayout from './components/ConsoleLayout';

// Storefront Pages
import HomePage from './pages/HomePage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';

// Console Pages
import ConsoleOverviewPage from './pages/ConsoleOverviewPage';
import LedgerPage from './pages/LedgerPage';
import DLQPage from './pages/DLQPage';
import AWSArchitecturePage from './pages/AWSArchitecturePage';

export default function App() {
  return (
    <OpsProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            {/* Storefront Routes Shell */}
            <Route path="/" element={<StoreLayout />}>
              <Route index element={<HomePage />} />
              <Route path="products/:productId" element={<ProductDetailPage />} />
              <Route path="cart" element={<CartPage />} />
              <Route path="checkout" element={<CheckoutPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="orders/:orderId" element={<OrderDetailPage />} />
            </Route>

            {/* Infrastructure Operations Console Shell */}
            <Route path="/console" element={<ConsoleLayout />}>
              <Route index element={<ConsoleOverviewPage />} />
              <Route path="ledger" element={<LedgerPage />} />
              <Route path="dlq" element={<DLQPage />} />
              <Route path="aws-architecture" element={<AWSArchitecturePage />} />
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </OpsProvider>
  );
}
