/**
 * =============================================================================
 * Fraud Engine Service (backend/src/services/fraudEngine.js)
 * Real-Time Transaction Risk Scoring & Anomaly Detection
 * =============================================================================
 */

// Simple in-memory cache for rate-limiting / velocity checks per customer IP/User
const velocityTracker = new Map();

/**
 * Calculates a comprehensive risk score (0 - 100) based on transaction telemetry.
 * 
 * Score Thresholds:
 *   - 0 to 30:  Low Risk (Standard Processing)
 *   - 31 to 69: Medium Risk (Flagged for Auditing)
 *   - 70+:      High Risk (Diverted to EventBridge Quarantined DLQ)
 * 
 * @param {Object} transaction - Transaction payload details
 * @param {number} transaction.totalAmount - Amount in INR/USD
 * @param {Array} transaction.items - Cart items array
 * @param {string} [transaction.ipAddress] - Client IP address
 * @param {number} [transaction.simulatedRiskScore] - Manual override for testing/viva
 * @returns {Object} Assessment result containing score, riskLevel, and flaggedRules
 */
function evaluateRisk(transaction) {
    // 1. Allow explicit simulation override for viva demonstration & testing
    if (typeof transaction.simulatedRiskScore === 'number') {
        const score = Math.min(100, Math.max(0, transaction.simulatedRiskScore));
        return {
            riskScore: score,
            riskLevel: getRiskLevel(score),
            isQuarantined: score >= 70,
            flaggedRules: ['SIMULATED_VIVA_TEST_OVERRIDE'],
            evaluatedAt: new Date().toISOString()
        };
    }

    let riskScore = 10; // Baseline low risk for authenticated requests
    const flaggedRules = [];

    const { totalAmount, items = [], ipAddress = '127.0.0.1' } = transaction;

    // Rule 1: High Transaction Value Threshold (> ₹50,000)
    if (totalAmount > 50000) {
        riskScore += 45;
        flaggedRules.push('HIGH_VALUE_TRANSACTION_EXCEEDS_50K');
    } else if (totalAmount > 20000) {
        riskScore += 20;
        flaggedRules.push('ELEVATED_VALUE_TRANSACTION');
    }

    // Rule 2: High Item Bulk / Quantity Anomaly (> 10 items of single SKU)
    const hasBulkItems = items.some(item => item.quantity > 10);
    if (hasBulkItems) {
        riskScore += 25;
        flaggedRules.push('BULK_QUANTITY_ANOMALY');
    }

    // Rule 3: Transaction Velocity / Burst Frequency Detection
    const now = Date.now();
    const userHistory = velocityTracker.get(ipAddress) || [];
    // Keep transactions within the last 60 seconds
    const recentTxns = userHistory.filter(timestamp => now - timestamp < 60000);
    recentTxns.push(now);
    velocityTracker.set(ipAddress, recentTxns);

    if (recentTxns.length >= 5) {
        riskScore += 35;
        flaggedRules.push('HIGH_VELOCITY_BURST_ATTEMPT');
    } else if (recentTxns.length >= 3) {
        riskScore += 15;
        flaggedRules.push('ELEVATED_REQUEST_VELOCITY');
    }

    // Cap score within [0, 100] range
    const finalScore = Math.min(100, riskScore);

    return {
        riskScore: finalScore,
        riskLevel: getRiskLevel(finalScore),
        isQuarantined: finalScore >= 70,
        flaggedRules,
        evaluatedAt: new Date().toISOString()
    };
}

/**
 * Maps numeric score to categorical risk level
 * @param {number} score 
 * @returns {'LOW' | 'MEDIUM' | 'HIGH'}
 */
function getRiskLevel(score) {
    if (score >= 70) return 'HIGH';
    if (score >= 35) return 'MEDIUM';
    return 'LOW';
}

module.exports = {
    evaluateRisk,
    assessRisk: evaluateRisk,
    getRiskLevel
};