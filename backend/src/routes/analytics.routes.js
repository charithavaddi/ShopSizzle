/**
 * =============================================================================
 * Analytics Routes (backend/src/routes/analytics.routes.js)
 * Real-Time Financial Transaction & Risk Analytics Endpoints
 * =============================================================================
 */

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const eventBus = require('../services/eventBus');

/**
 * @route   GET /api/analytics/summary
 * @desc    Fetch aggregated transaction, volume, and fraud metrics
 */
router.get('/summary', async (req, res, next) => {
    try {
        const query = `
            SELECT 
                COUNT(*) AS total_transactions,
                COALESCE(SUM(total_amount), 0) AS total_volume,
                COALESCE(AVG(total_amount), 0) AS average_order_value,
                COUNT(CASE WHEN status = 'SETTLED' THEN 1 END) AS settled_count,
                COUNT(CASE WHEN status = 'PENDING' THEN 1 END) AS pending_count
            FROM orders;
        `;

        const { rows } = await db.query(query);
        const stats = rows[0];

        // Retrieve live DLQ quarantine count from EventBridge bus
        const quarantinedEvents = eventBus.getQuarantinedEvents();

        return res.status(200).json({
            status: 'SUCCESS',
            timestamp: new Date().toISOString(),
            data: {
                totalTransactions: parseInt(stats.total_transactions, 10),
                totalVolume: parseFloat(stats.total_volume),
                averageOrderValue: parseFloat(stats.average_order_value).toFixed(2),
                settledCount: parseInt(stats.settled_count, 10),
                pendingCount: parseInt(stats.pending_count, 10),
                quarantinedDLQCount: quarantinedEvents.length
            }
        });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   GET /api/analytics/risk-distribution
 * @desc    Fetch ledger breakdown grouped by risk severity level
 */
router.get('/risk-distribution', async (req, res, next) => {
    try {
        const query = `
            SELECT 
                CASE 
                    WHEN risk_score >= 70 THEN 'HIGH'
                    WHEN risk_score >= 35 THEN 'MEDIUM'
                    ELSE 'LOW'
                END AS risk_level,
                COUNT(*) AS entry_count,
                COALESCE(SUM(amount), 0) AS volume
            FROM ledger_entries
            GROUP BY risk_level;
        `;

        const { rows } = await db.query(query);

        return res.status(200).json({
            status: 'SUCCESS',
            timestamp: new Date().toISOString(),
            distribution: rows
        });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   GET /api/analytics/recent-transactions
 * @desc    Fetch the latest 10 settled transactions with double-entry ledger details
 */
router.get('/recent-transactions', async (req, res, next) => {
    try {
        const query = `
            SELECT 
                o.id AS order_id,
                o.total_amount,
                o.currency,
                o.status,
                o.created_at,
                COALESCE(l.risk_score, 0) AS risk_score
            FROM orders o
            LEFT JOIN (
                SELECT DISTINCT ON (order_id) order_id, risk_score 
                FROM ledger_entries
            ) l ON o.id = l.order_id
            ORDER BY o.created_at DESC
            LIMIT 10;
        `;

        const { rows } = await db.query(query);

        return res.status(200).json({
            status: 'SUCCESS',
            count: rows.length,
            transactions: rows
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;