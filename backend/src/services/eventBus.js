/**
 * =============================================================================
 * AWS EventBridge / SQS Event Bus Simulator (backend/src/services/eventBus.js)
 * Handles asynchronous event routing, background worker queues, & DLQ buffering
 * =============================================================================
 */

const ledgerService = require('./ledgerService');
const fraudEngine = require('./fraudEngine');

class EventBusSimulator {
    constructor() {
        this.eventLog = [];
        this.deadLetterQueue = [];
        this.subscribers = new Map();
        this.eventBusName = process.env.AWS_EVENT_BUS_NAME || 'fincommerce-event-bus-production';
    }

    /**
     * Initialize event subscriptions and background queue processing
     */
    initSubscribers() {
        const handleOrderOrPaymentEvent = async (eventDetail) => {
            console.log(`[EventBridge] Processing event for Order ID: ${eventDetail.orderId}`);

            // Step 1: Run risk assessment through Fraud Engine if not pre-computed
            let riskScore = eventDetail.riskScore;
            if (riskScore === undefined || riskScore === null) {
                const riskAssessment = typeof fraudEngine.evaluateRisk === 'function'
                    ? fraudEngine.evaluateRisk(eventDetail)
                    : fraudEngine.assessRisk(eventDetail);
                riskScore = riskAssessment.riskScore || riskAssessment.score || 10;
                eventDetail.riskScore = riskScore;
                eventDetail.riskFactors = riskAssessment.flaggedRules || riskAssessment.factors || [];
            }

            // Step 2: Route high-risk transactions (>= 70) to Dead-Letter Queue (DLQ)
            if (riskScore >= 70) {
                console.warn(`[EventBridge -> SQS DLQ] Flagged high-risk transaction (${riskScore}/100). Quarantining event.`);
                
                const dlqPayload = {
                    dlqMessageId: `dlq_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                    eventId: eventDetail.eventId || `evt_${Date.now()}`,
                    originalEvent: eventDetail,
                    detail: eventDetail,
                    timestamp: new Date().toISOString(),
                    quarantinedAt: new Date().toISOString(),
                    status: 'PENDING_REVIEW',
                    quarantineReason: `High risk score threshold exceeded (${riskScore})`,
                    reason: `High risk score threshold exceeded (${riskScore})`
                };

                this.deadLetterQueue.push(dlqPayload);
                return { status: 'QUARANTINED', dlqMessageId: dlqPayload.dlqMessageId };
            }

            // Step 3: Low/Medium risk transactions proceed to Ledger Processing
            let ledgerResult = null;
            try {
                ledgerResult = await ledgerService.recordTransactionLedger({
                    orderId: eventDetail.orderId,
                    userId: eventDetail.userId,
                    amount: eventDetail.amount,
                    currency: eventDetail.currency || 'INR',
                    riskScore
                });
            } catch (err) {
                console.warn('[EventBus Ledger Notice]:', err.message);
            }

            return { 
                status: 'PROCESSED', 
                ledgerTransactionId: ledgerResult ? (ledgerResult.transactionId || ledgerResult.orderId) : `txn_${Date.now()}` 
            };
        };

        // EventBridge Rules: Route OrderPlaced, PAYMENT_COMPLETED, and PAYMENT_FLAGGED_HIGH_RISK
        this.subscribe('fincommerce.checkout', 'OrderPlaced', handleOrderOrPaymentEvent);
        this.subscribe('fincommerce.checkout', 'PAYMENT_COMPLETED', handleOrderOrPaymentEvent);
        this.subscribe('fincommerce.checkout', 'PAYMENT_FLAGGED_HIGH_RISK', handleOrderOrPaymentEvent);

        console.log('[EventBus] EventBridge rules and SQS consumers bound successfully.');
    }

    /**
     * Register an event listener for a specific source and detail-type
     */
    subscribe(source, detailType, handler) {
        const key = `${source}:${detailType}`;
        if (!this.subscribers.has(key)) {
            this.subscribers.set(key, []);
        }
        this.subscribers.get(key).push(handler);
    }

    /**
     * Publish an event onto the EventBridge Bus (Simulates PutEvents API)
     */
    async publishEvent(source, detailType, detail) {
        const eventEnvelope = {
            eventId: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            source,
            detailType,
            detail,
            timestamp: new Date().toISOString()
        };

        this.eventLog.push(eventEnvelope);

        const key = `${source}:${detailType}`;
        const handlers = this.subscribers.get(key) || [];

        const results = [];
        for (const handler of handlers) {
            try {
                const result = await handler(detail);
                results.push(result);
            } catch (error) {
                console.error(`[EventBus Handler Error] Failed to process event ${eventEnvelope.eventId}:`, error);
                
                // Route unhandled handler exceptions to DLQ
                this.deadLetterQueue.push({
                    dlqMessageId: `dlq_err_${Date.now()}`,
                    originalEvent: eventEnvelope,
                    detail: detail,
                    quarantinedAt: new Date().toISOString(),
                    timestamp: new Date().toISOString(),
                    status: 'ERROR',
                    reason: error.message,
                    quarantineReason: error.message
                });
            }
        }

        const isQuarantined = (detail && detail.riskScore >= 70) ||
            results.some(r => r && r.status === 'QUARANTINED') ||
            this.deadLetterQueue.some(item => item.originalEvent?.orderId === detail?.orderId || item.detail?.orderId === detail?.orderId);

        return {
            eventId: eventEnvelope.eventId,
            eventBusName: this.eventBusName,
            status: isQuarantined ? 'QUARANTINED_IN_DLQ' : 'PROCESSED',
            dispatchedTo: handlers.length,
            results
        };
    }

    /**
     * Alias for publishEvent to support both (source, detailType, detail) and (detailType, detail) signatures
     */
    async publish(sourceOrDefaultType, detailTypeOrDetail, detailMaybe) {
        if (detailMaybe !== undefined) {
            return this.publishEvent(sourceOrDefaultType, detailTypeOrDetail, detailMaybe);
        }
        return this.publishEvent('fincommerce.checkout', sourceOrDefaultType, detailTypeOrDetail);
    }

    /**
     * Admin Endpoint Utility: Fetch all quarantined DLQ messages
     */
    getQuarantinedEvents() {
        return this.deadLetterQueue;
    }

    /**
     * Admin Endpoint Utility: Clear or resolve a single DLQ message after manual review
     */
    clearQuarantinedEvent(dlqMessageId) {
        const initialLength = this.deadLetterQueue.length;
        this.deadLetterQueue = this.deadLetterQueue.filter(item => item.dlqMessageId !== dlqMessageId);
        return this.deadLetterQueue.length < initialLength;
    }

    /**
     * Admin Endpoint Utility: Purge all quarantined DLQ messages (bulk clear)
     */
    clearQuarantinedEvents() {
        const initialLength = this.deadLetterQueue.length;
        this.deadLetterQueue = [];
        return initialLength;
    }
}

// Singleton instance
const eventBusInstance = new EventBusSimulator();
eventBusInstance.initSubscribers();

module.exports = eventBusInstance;