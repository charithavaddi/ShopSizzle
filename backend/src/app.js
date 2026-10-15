/**
 * =============================================================================
 * Express Application Configuration (backend/src/app.js)
 * Configures middleware, security, route handlers, and global error handling
 * =============================================================================
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Import Route Handlers
const authRoutes = require('./routes/auth.routes');
const checkoutRoutes = require('./routes/checkout.routes');
const adminRoutes = require('./routes/admin.routes');
const analyticsRoutes = require('./routes/analytics.routes');

// Import Middleware
const path = require('path');
const { authenticateToken, authorizeRoles } = require('./middleware/auth');

const app = express();

// Base Middleware Setup
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Static UI Assets (FinCommerce Dashboard)
app.use(express.static(path.join(__dirname, '../public')));

const eventBus = require('./services/eventBus');

// Root Route - Serve Interactive UI Dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// System Health Check Endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'UP',
        timestamp: new Date().toISOString(),
        service: 'fincommerce-backend'
    });
});

// AWS Event Hub simulation endpoint for EventQueueMonitor
app.get('/api/aws-simulation/queue-status', (req, res) => {
    const quarantinedEvents = eventBus.getQuarantinedEvents();
    res.status(200).json({
        eventBusName: eventBus.eventBusName || 'fincommerce-event-bus-production',
        quarantinedDLQEvents: quarantinedEvents,
        dlqDepth: quarantinedEvents.length,
        status: 'ACTIVE'
    });
});

// Route Mounting
app.use('/api/auth', authRoutes);
app.use('/api/checkout', checkoutRoutes); // Idempotency applied inside route definitions
app.use('/api/analytics', authenticateToken, analyticsRoutes);
app.use('/api/admin', authenticateToken, authorizeRoles('ADMIN'), adminRoutes);

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        error: 'NOT_FOUND',
        message: `Route ${req.method} ${req.originalUrl} does not exist.`
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(`[SERVER ERROR] ${err.stack || err.message}`);

    const statusCode = err.statusCode || err.status || 500;
    res.status(statusCode).json({
        error: err.name || 'INTERNAL_SERVER_ERROR',
        message: err.message || 'An unexpected internal error occurred.'
    });
});

module.exports = app;