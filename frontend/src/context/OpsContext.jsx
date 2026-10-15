import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_ORDERS, INITIAL_LEDGER, INITIAL_DLQ_EVENTS } from '../data/demoData';

const OpsContext = createContext(null);

const ORDERS_KEY = 'fincommerce_orders_v1';
const LEDGER_KEY = 'fincommerce_ledger_v1';
const DLQ_KEY = 'fincommerce_dlq_v1';

export function OpsProvider({ children }) {
  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem(ORDERS_KEY);
      return saved ? JSON.parse(saved) : INITIAL_ORDERS;
    } catch {
      return INITIAL_ORDERS;
    }
  });

  const [ledger, setLedger] = useState(() => {
    try {
      const saved = localStorage.getItem(LEDGER_KEY);
      return saved ? JSON.parse(saved) : INITIAL_LEDGER;
    } catch {
      return INITIAL_LEDGER;
    }
  });

  const [dlqEvents, setDlqEvents] = useState(() => {
    try {
      const saved = localStorage.getItem(DLQ_KEY);
      return saved ? JSON.parse(saved) : INITIAL_DLQ_EVENTS;
    } catch {
      return INITIAL_DLQ_EVENTS;
    }
  });

  const [backendStatus, setBackendStatus] = useState('CHECKING'); // 'ONLINE' | 'STANDALONE_DEMO'

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
      localStorage.setItem(LEDGER_KEY, JSON.stringify(ledger));
      localStorage.setItem(DLQ_KEY, JSON.stringify(dlqEvents));
    } catch {
      // Storage error ignored
    }
  }, [orders, ledger, dlqEvents]);

  // Check backend connectivity
  useEffect(() => {
    fetch('http://localhost:5000/health')
      .then((res) => {
        if (res.ok) setBackendStatus('ONLINE');
        else setBackendStatus('STANDALONE_DEMO');
      })
      .catch(() => setBackendStatus('STANDALONE_DEMO'));
  }, []);

  /**
   * Post a balanced double-entry transaction to the ledger
   * Satisfies: Total Debits == Total Credits
   */
  const postLedgerEntries = (order) => {
    const time = new Date().toISOString();
    const journalId = `JNL_${Date.now()}`;
    const subtotal = order.subtotal;
    const tax = order.tax;
    const finalAmount = order.finalAmount;

    const entries = [
      // 1. DEBIT: Cash / Payment Clearing (Asset account increases)
      {
        id: `jnl_${Date.now()}_1`,
        journalId,
        orderId: order.id,
        timestamp: time,
        accountCode: '1010',
        accountName: 'Cash / Payment Clearing (Asset)',
        type: 'DEBIT',
        debit: finalAmount,
        credit: 0,
        currency: 'INR',
        postingStatus: 'POSTED',
        paymentRef: order.paymentRef || `PAY_${Date.now()}`,
        idempotencyKey: order.idempotencyKey,
      },
      // 2. CREDIT: Sales Revenue (Equity / Income account increases)
      {
        id: `jnl_${Date.now()}_2`,
        journalId,
        orderId: order.id,
        timestamp: time,
        accountCode: '4010',
        accountName: 'Hardware Sales Revenue (Equity)',
        type: 'CREDIT',
        debit: 0,
        credit: subtotal,
        currency: 'INR',
        postingStatus: 'POSTED',
        paymentRef: order.paymentRef || `PAY_${Date.now()}`,
        idempotencyKey: order.idempotencyKey,
      },
      // 3. CREDIT: GST Tax Payable (Liability account increases)
      {
        id: `jnl_${Date.now()}_3`,
        journalId,
        orderId: order.id,
        timestamp: time,
        accountCode: '2020',
        accountName: '18% GST Output Tax Payable (Liability)',
        type: 'CREDIT',
        debit: 0,
        credit: tax,
        currency: 'INR',
        postingStatus: 'POSTED',
        paymentRef: order.paymentRef || `PAY_${Date.now()}`,
        idempotencyKey: order.idempotencyKey,
      },
    ];

    setLedger((prev) => [...entries, ...prev]);
  };

  /**
   * Add a successful order and post balanced ledger entries
   */
  const recordSuccessfulOrder = (order) => {
    const fullOrder = {
      ...order,
      status: 'SUCCEEDED',
      ledgerPosted: true,
      createdAt: order.createdAt || new Date().toISOString(),
    };
    setOrders((prev) => [fullOrder, ...prev]);
    postLedgerEntries(fullOrder);
  };

  /**
   * Quarantine a high-risk transaction in the DLQ
   */
  const recordQuarantinedOrder = (order, riskScore = 84, triggeredRules = ['SIMULATED_VIVA_TEST_OVERRIDE']) => {
    const eventId = `ev-eb-${Date.now()}`;
    const fullOrder = {
      ...order,
      status: 'QUARANTINED',
      riskScore,
      dlqEventId: eventId,
      ledgerPosted: false,
      createdAt: order.createdAt || new Date().toISOString(),
    };

    const dlqEvent = {
      eventId,
      orderId: order.id,
      receivedAt: new Date().toISOString(),
      riskScore,
      triggeredRules,
      reason: `Automated risk score (${riskScore}/100) exceeded safety policy threshold (>=70). Quarantined to Amazon SQS DLQ.`,
      retryCount: 0,
      queueStatus: 'QUARANTINED',
      sourceQueue: 'arn:aws:sqs:ap-south-1:123456789012:fincommerce-orders-primary',
      dlqArn: 'arn:aws:sqs:ap-south-1:123456789012:fincommerce-fraud-dlq-production',
      payload: {
        amount: order.finalAmount,
        currency: 'INR',
        buyer: order.customerEmail,
        paymentMethod: order.paymentMethod,
      },
      errorSummary: 'E_FRAUD_QUARANTINE: Transaction placed on operational hold. Manual redrive or verification required.',
    };

    setOrders((prev) => [fullOrder, ...prev]);
    setDlqEvents((prev) => [dlqEvent, ...prev]);
  };

  /**
   * Replay / Redrive a quarantined event into the ledger
   */
  const retryDLQEvent = async (eventId) => {
    const event = dlqEvents.find((e) => e.eventId === eventId);
    if (!event) return;

    // Call backend API if online
    if (backendStatus === 'ONLINE') {
      try {
        await fetch(`http://localhost:5000/api/admin/dlq/retry/${eventId}`, {
          method: 'POST',
        });
      } catch {
        // Fallback to local state transition
      }
    }

    // Find the associated order
    const associatedOrder = orders.find((o) => o.id === event.orderId || o.dlqEventId === eventId);
    if (associatedOrder) {
      const updatedOrder = {
        ...associatedOrder,
        status: 'SUCCEEDED',
        ledgerPosted: true,
      };
      setOrders((prev) => prev.map((o) => (o.id === associatedOrder.id ? updatedOrder : o)));
      postLedgerEntries(updatedOrder);
    }

    // Update DLQ event status
    setDlqEvents((prev) =>
      prev.map((e) =>
        e.eventId === eventId
          ? { ...e, queueStatus: 'REPROCESSED_SUCCESS', retryCount: e.retryCount + 1 }
          : e
      )
    );
  };

  /**
   * Purge the DLQ queue buffer
   */
  const purgeDLQ = async () => {
    if (backendStatus === 'ONLINE') {
      try {
        await fetch('http://localhost:5000/api/admin/dlq/clear', { method: 'DELETE' });
      } catch {
        // Fallback
      }
    }
    setDlqEvents([]);
  };

  return (
    <OpsContext.Provider
      value={{
        orders,
        ledger,
        dlqEvents,
        backendStatus,
        recordSuccessfulOrder,
        recordQuarantinedOrder,
        retryDLQEvent,
        purgeDLQ,
      }}
    >
      {children}
    </OpsContext.Provider>
  );
}

export function useOps() {
  const context = useContext(OpsContext);
  if (!context) {
    throw new Error('useOps must be used within an OpsProvider');
  }
  return context;
}
