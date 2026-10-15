/**
 * =============================================================================
 * Payment Orchestrator Service (backend/src/services/paymentOrchestrator.js)
 * Master Business Logic & Event Dispatching Coordinator
 * =============================================================================
 */

const db = require('../config/db');
const fraudEngine = require('./fraudEngine');
const eventBus = require('./eventBus');

/**
 * Orchestrates an end-to-end checkout and payment request.
 * 
 * Pipeline Workflow:
 *  1. Database Order Initialization (Status: PENDING)
 *  2. Real-time Risk Assessment via Fraud Engine
 *  3. EventBridge Bus Event Publication (PAYMENT_COMPLETED / PAYMENT_FLAGGED)
 *  4. Returns immediate non-blocking HTTP response
 * 
 * @param {Object} payload - Checkout transaction payload
 * @param {Array} payload.items - List of purchased items
 * @param {number} payload.totalAmount - Total order amount
 * @param {string} [payload.currency='INR'] - Currency code
 * @param {string} [payload.ipAddress] - Client IP address
 * @param {number} [payload.simulatedRiskScore] - Manual risk score override for viva/testing
 * @param {string} idempotencyKey - Evaluated idempotency key
 * @returns {Promise<Object>} Execution result summary
 */
async function processCheckout(payload, idempotencyKey) {
    const { items, totalAmount, currency = 'INR', ipAddress, simulatedRiskScore } = payload;

    if (!items || items.length === 0 || !totalAmount) {
        throw new Error('[Payment Orchestrator]: Invalid payload. Items array and totalAmount are required.');
    }

    const client = await db.getClient();

    try {
        await client.query('BEGIN');

        // Step 1: Create Order record in PostgreSQL
        const insertOrderQuery = `
            INSERT INTO orders (total_amount, currency, status)
            VALUES ($1, $2, 'PENDING')
            RETURNING id, total_amount, currency, status, created_at;
        `;
        const orderResult = await client.query(insertOrderQuery, [totalAmount, currency]);
        const order = orderResult.rows[0];

        await client.query('COMMIT');

        // Step 2: Evaluate Risk using Fraud Engine
        const riskAssessment = fraudEngine.evaluateRisk({
            totalAmount,
            items,
            ipAddress,
            simulatedRiskScore
        });

        // Step 3: Construct Event Payload for AWS EventBridge Bus
        const eventDetail = {
            orderId: order.id,
            transactionId: `txn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            amount: parseFloat(totalAmount),
            currency: order.currency,
            itemsCount: items.reduce((acc, item) => acc + item.quantity, 0),
            riskScore: riskAssessment.riskScore,
            riskLevel: riskAssessment.riskLevel,
            idempotencyKey,
            timestamp: new Date().toISOString()
        };

        // Step 4: Publish Event to EventBridge Simulation Bus
        const eventType = riskAssessment.isQuarantined 
            ? 'PAYMENT_FLAGGED_HIGH_RISK' 
            : 'PAYMENT_COMPLETED';

        const eventBridgeResult = eventBus.publishEvent(
            'fincommerce.checkout',
            eventType,
            eventDetail
        );

        // Step 5: Return summary for HTTP Response & Idempotency Store
        return {
            success: true,
            message: riskAssessment.isQuarantined 
                ? 'Transaction flagged for risk evaluation and routed to quarantine DLQ.' 
                : 'Transaction accepted and dispatched for settlement.',
            orderId: order.id,
            transactionId: eventDetail.transactionId,
            status: riskAssessment.isQuarantined ? 'QUARANTINED' : 'PROCESSING',
            riskAssessment: {
                score: riskAssessment.riskScore,
                level: riskAssessment.riskLevel,
                flaggedRules: riskAssessment.flaggedRules
            },
            eventBridgeStatus: {
                eventId: eventBridgeResult.eventId,
                busName: eventBridgeResult.eventBusName,
                quarantined: riskAssessment.isQuarantined
            }
        };

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('[Payment Orchestrator Error]:', err.message);
        throw err;
    } finally {
        client.release();
    }
}

module.exports = {
    processCheckout
};