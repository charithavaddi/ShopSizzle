/**
 * =============================================================================
 * Admin & Observability Routes (backend/src/routes/admin.routes.js)
 * Endpoints for System Monitoring, EventBridge Queue Inspection, & DLQ Management
 * =============================================================================
 */

const express = require('express');
const router = express.Router();

const eventBus = require('../services/eventBus');
const ledgerService = require('../services/ledgerService');
const db = require('../config/db');

/**
 * @route   GET /api/admin/metrics
 * @desc    Fetch aggregated system metrics (Total Orders, Ledger Volume, DLQ Depth)
 */
router.get('/metrics', async (req, res, next) => {
    try {
        const orderStats = await db.query(`
            SELECT 
                COUNT(*) AS total_orders,
                COUNT(CASE WHEN status = 'SETTLED' THEN 1 END) AS settled_orders,
                COUNT(CASE WHEN status = 'PENDING' THEN 1 END) AS pending_orders,
                COALESCE(SUM(total_amount), 0) AS gross_volume
            FROM orders;
        `);

        const dlqEvents = eventBus.getQuarantinedEvents();

        return res.status(200).json({
            status: 'SUCCESS',
            timestamp: new Date().toISOString(),
            metrics: {
                orders: orderStats.rows[0],
                dlqDepth: dlqEvents.length,
                eventBusStatus: 'ACTIVE'
            }
        });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   GET /api/admin/dlq
 * @desc    Inspect all quarantined high-risk events currently stored in the DLQ
 */
router.get('/dlq', (req, res) => {
    const quarantinedEvents = eventBus.getQuarantinedEvents();

    return res.status(200).json({
        eventBusName: eventBus.eventBusName,
        quarantinedCount: quarantinedEvents.length,
        events: quarantinedEvents
    });
});

/**
 * @route   POST /api/admin/dlq/retry/:eventId
 * @desc    Manually release/replay a quarantined DLQ event into the ledger
 */
router.post('/dlq/retry/:eventId', async (req, res, next) => {
    const { eventId } = req.params;

    try {
        const quarantinedEvents = eventBus.getQuarantinedEvents();
        const targetIndex = quarantinedEvents.findIndex((e) => e.eventId === eventId);

        if (targetIndex === -1) {
            return res.status(404).json({
                error: 'EVENT_NOT_FOUND',
                message: `No quarantined event found with ID: ${eventId}`
            });
        }

        const [eventToRetry] = quarantinedEvents.splice(targetIndex, 1);

        // Manually process through ledger accounting
        const ledgerResult = await ledgerService.recordTransactionLedger({
            orderId: eventToRetry.detail.orderId,
            amount: eventToRetry.detail.amount,
            currency: eventToRetry.detail.currency,
            riskScore: eventToRetry.detail.riskScore
        });

        return res.status(200).json({
            status: 'REPLAYED',
            message: `Event ${eventId} successfully released from DLQ and posted to ledger.`,
            event: eventToRetry,
            ledgerResult
        });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   DELETE /api/admin/dlq/clear
 * @desc    Purge all quarantined events from the DLQ buffer
 */
router.delete('/dlq/clear', (req, res) => {
    const clearedCount = typeof eventBus.clearQuarantinedEvents === 'function'
        ? eventBus.clearQuarantinedEvents()
        : (eventBus.getQuarantinedEvents ? eventBus.getQuarantinedEvents().splice(0).length : 0);

    return res.status(200).json({
        status: 'CLEARED',
        message: `Successfully purged ${clearedCount} quarantined events from DLQ.`,
        currentDlqDepth: 0
    });
});

/**
 * @route   DELETE /api/admin/dlq/:eventId
 * @desc    Remove a single quarantined event from the DLQ buffer
 */
router.delete('/dlq/:eventId', (req, res) => {
    const { eventId } = req.params;
    const removed = typeof eventBus.clearQuarantinedEvent === 'function'
        ? eventBus.clearQuarantinedEvent(eventId)
        : false;

    return res.status(200).json({
        status: removed ? 'REMOVED' : 'NOT_FOUND',
        eventId
    });
});

module.exports = router;