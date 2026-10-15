import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, CheckCircle, ShieldAlert, RefreshCw, Cpu, Database, Server } from 'lucide-react';

/**
 * EventQueueMonitor.jsx
 * AWS Service Simulation Console Component
 * Visualizes:
 *  1. EventBridge Transaction Bus status
 *  2. Real-time active events flowing through SQS consumers
 *  3. Enhancement Feature: Quarantined High-Risk Events in DLQ
 */
export default function EventQueueMonitor({ apiBaseUrl = 'http://localhost:5000' }) {
    const [queueData, setQueueData] = useState({
        eventBusName: 'FinCommerce-Transaction-Bus',
        quarantinedDLQEvents: [],
        dlqDepth: 0,
        status: 'ACTIVE'
    });
    const [isLoading, setIsLoading] = useState(false);
    const [lastRefreshed, setLastRefreshed] = useState(new Date().toLocaleTimeString());

    // Fetch AWS Simulation State from Backend
    const fetchQueueState = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${apiBaseUrl}/api/aws-simulation/queue-status`);
            if (res.ok) {
                const data = await res.json();
                setQueueData(data);
                setLastRefreshed(new Date().toLocaleTimeString());
            }
        } catch (err) {
            console.error('Failed to connect to simulated AWS Event Hub backend:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Auto-poll status every 5 seconds for live visual updates
    useEffect(() => {
        fetchQueueState();
        const interval = setInterval(fetchQueueState, 5000);
        return () => clearInterval(interval);
    }, [apiBaseUrl]);

    return (
        <div className="w-full bg-slate-900 text-slate-100 p-6 rounded-xl border border-slate-800 shadow-2xl space-y-6">
            
            {/* Header / Control Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
                <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
                        <Cpu className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            AWS EventBridge Simulation Console
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                                LIVE
                            </span>
                        </h2>
                        <p className="text-xs text-slate-400 font-mono">
                            Bus: {queueData.eventBusName || 'FinCommerce-Transaction-Bus'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 font-mono">
                        Refreshed: {lastRefreshed}
                    </span>
                    <button
                        onClick={fetchQueueState}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-200 rounded-lg border border-slate-700 transition"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh Queue
                    </button>
                </div>
            </div>

            {/* Architecture Pipeline Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* 1. EventBridge Router Node */}
                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/60 flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
                        <Activity className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                            Event Bus Router
                        </p>
                        <p className="text-sm font-semibold text-slate-200">
                            Rules Active (3)
                        </p>
                        <span className="text-xs text-blue-400 font-mono">Routing PAYMENT_COMPLETED</span>
                    </div>
                </div>

                {/* 2. SQS Consumers Node */}
                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/60 flex items-center gap-4">
                    <div className="p-3 bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/20">
                        <Server className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                            Active Workers (SQS)
                        </p>
                        <p className="text-sm font-semibold text-slate-200">
                            Ledger & Inventory Workers
                        </p>
                        <span className="text-xs text-emerald-400 font-mono">Status: Healthy</span>
                    </div>
                </div>

                {/* 3. Dead-Letter Queue / Enhancement Interceptor */}
                <div className={`p-4 rounded-lg border flex items-center gap-4 transition ${
                    queueData.dlqDepth > 0 
                        ? 'bg-rose-950/20 border-rose-500/40 text-rose-200' 
                        : 'bg-slate-800/50 border-slate-700/60 text-slate-200'
                }`}>
                    <div className={`p-3 rounded-lg border ${
                        queueData.dlqDepth > 0 
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>
                        <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wider font-semibold opacity-80">
                            Quarantined DLQ Depth
                        </p>
                        <p className="text-xl font-bold font-mono">
                            {queueData.dlqDepth} {queueData.dlqDepth === 1 ? 'Event' : 'Events'}
                        </p>
                        <span className={`text-xs font-mono ${queueData.dlqDepth > 0 ? 'text-rose-400 font-semibold' : 'text-slate-400'}`}>
                            {queueData.dlqDepth > 0 ? 'High-Risk Events Intercepted' : 'No Quarantined Events'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Quarantined Events Queue Viewer (ENHANCEMENT DEMONSTRATION) */}
            <div className="bg-slate-950 rounded-xl border border-slate-800 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        Quarantined Event Buffer (Fraud DLQ)
                    </h3>
                    <span className="text-xs font-mono bg-slate-800 text-slate-300 px-2.5 py-1 rounded">
                        Enhancement: Risk &gt; 70 Interception
                    </span>
                </div>

                {queueData.quarantinedDLQEvents && queueData.quarantinedDLQEvents.length > 0 ? (
                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                        {queueData.quarantinedDLQEvents.map((event, idx) => (
                            <div 
                                key={event.eventId || idx} 
                                className="bg-slate-900 border border-rose-900/40 rounded-lg p-4 font-mono text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:border-rose-700/60 transition"
                            >
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">
                                            {event.eventId}
                                        </span>
                                        <span className="text-slate-400">
                                            {new Date(event.timestamp).toLocaleTimeString()}
                                        </span>
                                    </div>
                                    <p className="text-slate-300">
                                        Order ID: <span className="text-indigo-400">{event.detail?.orderId || 'N/A'}</span> | 
                                        Transaction: <span className="text-amber-400">{event.detail?.transactionId || 'N/A'}</span>
                                    </p>
                                    <p className="text-rose-400 text-[11px]">
                                        Reason: {event.quarantineReason || 'HIGH_RISK_TRANSACTION'}
                                    </p>
                                </div>

                                <div className="flex flex-col sm:items-end gap-1">
                                    <span className="px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold">
                                        Risk Score: {event.detail?.riskScore || 85}/100
                                    </span>
                                    <span className="text-[10px] text-slate-500">
                                        Amount: ₹{event.detail?.amount?.toLocaleString('en-IN') || '0.00'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-slate-500 font-mono text-xs space-y-2">
                        <CheckCircle className="w-8 h-8 text-emerald-500/40 mx-auto" />
                        <p>No high-risk transactions currently quarantined in DLQ.</p>
                        <p className="text-[11px] text-slate-600">
                            Perform a checkout exceeding ₹50,000 to test the real-time fraud interception enhancement.
                        </p>
                    </div>
                )}
            </div>

            {/* Faculty Demonstration Helper */}
            <div className="bg-indigo-950/30 border border-indigo-800/40 rounded-lg p-3 text-xs text-indigo-300 flex items-start gap-2 font-mono">
                <Database className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                <span>
                    <strong>Viva Demo Tip:</strong> This widget directly reflects asynchronous EventBridge messages routed to SQS workers. Low-risk transactions process immediately to PostgreSQL ledger entries, while high-risk events divert into this quarantine buffer without blocking HTTP responses.
                </span>
            </div>

        </div>
    );
}