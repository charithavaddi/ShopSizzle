-- =============================================================================
-- FinCommerce Database Schema (PostgreSQL)
-- Architecture: Financial-Grade E-Commerce & Transaction Platform
-- =============================================================================

-- Enable UUID extension for cryptographic primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. USERS & ACCESS CONTROL (RBAC)
-- Roles: CUSTOMER, ADMIN, FINANCE_ADMIN, SUPPORT
-- -----------------------------------------------------------------------------
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'CUSTOMER' 
        CHECK (role IN ('CUSTOMER', 'ADMIN', 'FINANCE_ADMIN', 'SUPPORT')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 2. PRODUCT CATALOGUE & INVENTORY
-- Core e-commerce entities with strict non-negative constraints
-- -----------------------------------------------------------------------------
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    discount_price NUMERIC(12, 2) DEFAULT 0.00 CHECK (discount_price >= 0),
    stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 3. ORDERS & ORDER ITEMS
-- Enforces explicit order state machine transition
-- -----------------------------------------------------------------------------
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
    discount_amount NUMERIC(12, 2) DEFAULT 0.00 CHECK (discount_amount >= 0),
    tax_amount NUMERIC(12, 2) DEFAULT 0.00 CHECK (tax_amount >= 0),
    final_amount NUMERIC(12, 2) NOT NULL CHECK (final_amount >= 0),
    status VARCHAR(30) NOT NULL DEFAULT 'PAYMENT_PENDING'
        CHECK (status IN (
            'CART', 'CHECKOUT', 'PAYMENT_PENDING', 'PAYMENT_PROCESSING', 
            'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 
            'PAYMENT_FAILED', 'CANCELLED', 'REFUND_PENDING', 'PARTIALLY_REFUNDED', 'REFUNDED'
        )),
    shipping_address TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    total_price NUMERIC(12, 2) NOT NULL CHECK (total_price >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 4. PAYMENT TRANSACTIONS & IDEMPOTENCY
-- Idempotency key registry to prevent double charging & duplicate executions
-- -----------------------------------------------------------------------------
CREATE TABLE idempotency_keys (
    key VARCHAR(255) PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    request_path VARCHAR(255) NOT NULL,
    response_json JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    transaction_id VARCHAR(100) UNIQUE NOT NULL, -- Internal or Gateway Ref
    provider VARCHAR(50) NOT NULL DEFAULT 'MOCK_PAYMENT' 
        CHECK (provider IN ('MOCK_PAYMENT', 'STRIPE', 'RAZORPAY')),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) DEFAULT 'INR',
    status VARCHAR(30) NOT NULL DEFAULT 'CREATED'
        CHECK (status IN (
            'CREATED', 'PENDING', 'PROCESSING', 'SUCCESS', 
            'FAILED', 'CANCELLED', 'REFUND_PENDING', 'REFUNDED'
        )),
    idempotency_key VARCHAR(255) REFERENCES idempotency_keys(key) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 5. DOUBLE-ENTRY FINANCIAL LEDGER
-- Immutable ledger system: Debits and credits must balance perfectly
-- -----------------------------------------------------------------------------
CREATE TABLE ledger_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'CUSTOMER_CLEARING', 'MERCHANT_REVENUE'
    name VARCHAR(100) NOT NULL,
    type VARCHAR(30) NOT NULL CHECK (type IN ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ledger_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_id VARCHAR(100) NOT NULL, -- Order ID or Payment ID
    transaction_type VARCHAR(50) NOT NULL, -- 'PAYMENT_RECEIVED', 'REFUND_ISSUED'
    status VARCHAR(20) DEFAULT 'POSTED' CHECK (status IN ('PENDING', 'POSTED', 'VOIDED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ledger_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES ledger_transactions(id) ON DELETE RESTRICT,
    debit_account VARCHAR(50) NOT NULL REFERENCES ledger_accounts(code),
    credit_account VARCHAR(50) NOT NULL REFERENCES ledger_accounts(code),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 6. FRAUD RISK ENGINE & SIMULATED EVENT QUEUE (AWS SIMULATION)
-- Captures risk assessment and simulated EventBridge / SQS quarantine state
-- -----------------------------------------------------------------------------
CREATE TABLE fraud_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    risk_score INT NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
    decision VARCHAR(20) NOT NULL CHECK (decision IN ('APPROVE', 'REVIEW', 'BLOCK')),
    triggered_rules JSONB NOT NULL DEFAULT '[]'::jsonb,
    queue_status VARCHAR(30) DEFAULT 'PROCESSED' 
        CHECK (queue_status IN ('PROCESSED', 'QUARANTINED_IN_DLQ', 'MANUALLY_APPROVED', 'MANUALLY_REJECTED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 7. AUDIT LOGGING
-- Immutable record of all sensitive administrative and financial actions
-- -----------------------------------------------------------------------------
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    actor_role VARCHAR(30) NOT NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(100),
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- PERFORMANCE INDEXES
-- Critical indexes for instant lookups during peak transaction flow
-- =============================================================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX idx_idempotency_created_at ON idempotency_keys(created_at);
CREATE INDEX idx_ledger_entries_transaction ON ledger_entries(transaction_id);
CREATE INDEX idx_fraud_assessments_order ON fraud_assessments(order_id);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- =============================================================================
-- SEED DEFAULT LEDGER ACCOUNTS
-- Standard banking / fintech account chart
-- =============================================================================
INSERT INTO ledger_accounts (code, name, type) VALUES
('CUSTOMER_CLEARING', 'Customer Payment Clearing Account', 'ASSET'),
('MERCHANT_REVENUE', 'Merchant Platform Revenue', 'REVENUE'),
('REFUND_EXPENSE', 'Refund Contra-Revenue Account', 'EXPENSE'),
('PLATFORM_RESERVE', 'Platform Risk & Fraud Reserve', 'LIABILITY')
ON CONFLICT (code) DO NOTHING;