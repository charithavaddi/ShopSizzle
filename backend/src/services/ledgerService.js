/**
 * =============================================================================
 * Ledger Accounting Service (backend/src/services/ledgerService.js)
 * Double-Entry Accounting & Ledger Posting Engine
 * =============================================================================
 */

const db = require('../config/db');

/**
 * Posts a double-entry financial record to the ledger in a single SQL transaction.
 * Creates balanced DEBIT and CREDIT entries for the transaction.
 * 
 * @param {Object} eventPayload - The event details received from EventBridge
 * @param {string} eventPayload.orderId - UUID of the order
 * @param {number} eventPayload.amount - Transaction amount
 * @param {string} [eventPayload.currency='INR'] - Currency unit
 * @param {number} [eventPayload.riskScore=0] - Evaluated risk score
 * @returns {Promise<Object>} Summary of posted ledger entries
 */
async function recordTransactionLedger(eventPayload) {
    const { orderId, amount, currency = 'INR', riskScore = 0 } = eventPayload;

    if (!orderId || !amount) {
        throw new Error('[Ledger Error]: Invalid event payload. Missing orderId or amount.');
    }

    const client = await db.getClient();

    try {
        await client.query('BEGIN');

        // 1. Double-Entry Posting: Debit Customer Account / Receivables
        const debitQuery = `
            INSERT INTO ledger_entries (order_id, account_type, amount, risk_score)
            VALUES ($1, 'DEBIT', $2, $3)
            RETURNING id, account_type, amount, created_at;
        `;
        const debitRes = await client.query(debitQuery, [orderId, amount, riskScore]);

        // 2. Double-Entry Posting: Credit Revenue / Settlement Account
        const creditQuery = `
            INSERT INTO ledger_entries (order_id, account_type, amount, risk_score)
            VALUES ($1, 'CREDIT', $2, $3)
            RETURNING id, account_type, amount, created_at;
        `;
        const creditRes = await client.query(creditQuery, [orderId, amount, riskScore]);

        // 3. Update Order Status to SETTLED
        const updateOrderQuery = `
            UPDATE orders 
            SET status = 'SETTLED'
            WHERE id = $1;
        `;
        await client.query(updateOrderQuery, [orderId]);

        await client.query('COMMIT');

        console.log(`[Ledger Service] Successfully posted double-entry ledger for Order: ${orderId}`);

        return {
            status: 'POSTED',
            orderId,
            amount,
            entries: [debitRes.rows[0], creditRes.rows[0]]
        };
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(`[Ledger Service Error] Failed to post ledger for Order ${orderId}:`, err.message);
        throw err;
    } finally {
        client.release();
    }
}

/**
 * Retrieves the double-entry accounting ledger history for a given order.
 * 
 * @param {string} orderId - Order UUID
 * @returns {Promise<Array>} Array of ledger records
 */
async function getLedgerByOrderId(orderId) {
    const query = `
        SELECT id, order_id, account_type, amount, risk_score, created_at 
        FROM ledger_entries 
        WHERE order_id = $1 
        ORDER BY created_at DESC;
    `;
    const { rows } = await db.query(query, [orderId]);
    return rows;
}

module.exports = {
    recordTransactionLedger,
    getLedgerByOrderId
};