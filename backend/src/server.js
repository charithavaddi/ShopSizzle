/**
 * =============================================================================
 * Express Application Configuration (backend/src/app.js)
 * Mounts routes, middleware, and global error handlers
 * =============================================================================
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');


// Import Route Handlers
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const checkoutRoutes = require('./routes/checkout.routes');

// Import Authentication & Authorization Middleware
const { authenticateToken, authorizeRoles } = require('./middleware/auth');

// backend/src/server.js
require('dotenv').config(); // Load environment variables first

const app = require('./app');
const { initSubscribers } = require('./services/eventBus');

const PORT = process.env.PORT || 5000;

// Initialize event subscribers if defined
if (typeof initSubscribers === 'function') {
    initSubscribers();
}

app.listen(PORT, () => {
    console.log(`[Server] FinCommerce backend running on port ${PORT}`);
});

// Security and Logging Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Health Check Endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'UP',
        timestamp: new Date().toISOString(),
        service: 'fincommerce-backend'
    });
});

// Unprotected Auth Routes (Login / Register)
app.use('/api/auth', authRoutes);

// Protected Checkout Routes
app.use('/api/checkout', authenticateToken, checkoutRoutes);

// Protected Analytics Routes
app.use('/api/analytics', authenticateToken, analyticsRoutes);

// Protected Admin & Observability Routes (ADMIN role required)
app.use('/api/admin', authenticateToken, authorizeRoles('ADMIN'), adminRoutes);

// 404 Route Not Found Handler
app.use((req, res, next) => {
    res.status(404).json({
        error: 'NOT_FOUND',
        message: `Cannot ${req.method} ${req.originalUrl}`
    });
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(`[ERROR] ${err.stack || err.message}`);

    const statusCode = err.statusCode || err.status || 500;
    return res.status(statusCode).json({
        error: err.name || 'INTERNAL_SERVER_ERROR',
        message: err.message || 'An unexpected server error occurred.',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

module.exports = app;