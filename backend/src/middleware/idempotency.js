/**
 * =============================================================================
 * Idempotency Middleware (backend/src/middleware/idempotency.js)
 * Financial System Requirement: Double-Charge & Duplicate Execution Protection
 * Primary: Redis / Upstash
 * Fallback: PostgreSQL (idempotency_keys table) / In-Memory Map
 * =============================================================================
 */

const db = require('../config/db');
const redis = require('../config/redis');

const IDEMPOTENCY_TTL = 86400; // 24 hours
const LOCK_TTL = 30; // 30 seconds processing timeout

// Fallback in-memory cache for standalone local testing
const memoryCache = new Map();

const idempotencyMiddleware = async (req, res, next) => {
    // 1. Only enforce idempotency on state-changing financial endpoints
    if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
        return next();
    }

    const idempotencyKey = req.headers['x-idempotency-key'];

    // If no key is provided, proceed normally
    if (!idempotencyKey) {
        return next();
    }

    const cacheKey = `idempotency:${idempotencyKey}`;
    const lockKey = `lock:idempotency:${idempotencyKey}`;

    try {
        // ---------------------------------------------------------------------
        // STEP 1: Check In-Memory Fast Cache
        // ---------------------------------------------------------------------
        if (memoryCache.has(idempotencyKey)) {
            const parsed = memoryCache.get(idempotencyKey);
            console.log(`[Idempotency Guard] In-Memory hit for key: ${idempotencyKey}`);
            res.setHeader('x-cache-hit', 'true');
            return res.status(parsed.status || 200).json({ ...parsed.body, isIdempotentReplay: true });
        }

        // ---------------------------------------------------------------------
        // STEP 2: Check Redis Cache (Distributed Fast Path)
        // ---------------------------------------------------------------------
        if (redis && redis.status === 'ready') {
            try {
                const cachedResponse = await redis.get(cacheKey);
                if (cachedResponse) {
                    console.log(`[Idempotency Guard] Redis hit for key: ${idempotencyKey}`);
                    const parsed = JSON.parse(cachedResponse);
                    res.setHeader('x-cache-hit', 'true');
                    return res.status(parsed.status || 200).json({ ...parsed.body, isIdempotentReplay: true });
                }

                // Acquire atomic lock in Redis to prevent concurrent in-flight executions
                const lockAcquired = await redis.set(lockKey, 'IN_PROGRESS', 'EX', LOCK_TTL, 'NX');
                if (!lockAcquired) {
                    console.warn(`[Idempotency Guard] Concurrent request blocked for key: ${idempotencyKey}`);
                    return res.status(409).json({
                        error: 'CONCURRENT_REQUEST',
                        message: 'A transaction with this idempotency key is currently processing. Please wait.'
                    });
                }
            } catch (redisErr) {
                console.warn('[Idempotency Guard] Redis operation failed:', redisErr.message);
            }
        }

        // ---------------------------------------------------------------------
        // STEP 3: Check PostgreSQL Database (Persistent Path)
        // ---------------------------------------------------------------------
        try {
            const dbResult = await db.query(
                `SELECT response_json FROM idempotency_keys WHERE key = $1`,
                [idempotencyKey]
            );

            if (dbResult && dbResult.rows && dbResult.rows.length > 0) {
                console.log(`[Idempotency Guard] Postgres hit for key: ${idempotencyKey}`);
                
                // Release Redis lock if acquired
                if (redis && redis.status === 'ready') await redis.del(lockKey).catch(() => {});
                
                const savedResponse = dbResult.rows[0].response_json;
                res.setHeader('x-cache-hit', 'true');
                return res.status(savedResponse.status || 200).json({ ...savedResponse.body, isIdempotentReplay: true });
            }
        } catch (dbErr) {
            // DB is offline or table does not exist yet; proceed without throwing
        }

        // ---------------------------------------------------------------------
        // STEP 4: Intercept res.json to capture and persist response payload
        // ---------------------------------------------------------------------
        const originalJson = res.json.bind(res);

        res.json = (body) => {
            const statusCode = res.statusCode || 200;
            const userId = req.user ? req.user.id : null;

            // Only cache successful business logic results (Status < 500)
            if (statusCode < 500) {
                const responsePayload = {
                    status: statusCode,
                    body: body,
                    cachedAt: new Date().toISOString()
                };

                // Store in memory cache
                memoryCache.set(idempotencyKey, responsePayload);

                // Async background save
                (async () => {
                    try {
                        // Save to PostgreSQL if available
                        await db.query(
                            `INSERT INTO idempotency_keys (key, user_id, request_path, response_json)
                             VALUES ($1, $2, $3, $4)
                             ON CONFLICT (key) DO NOTHING;`,
                            [idempotencyKey, userId, req.originalUrl, JSON.stringify(responsePayload)]
                        );

                        // Save to Redis with 24-Hour TTL if available
                        if (redis && redis.status === 'ready') {
                            await redis.setex(cacheKey, IDEMPOTENCY_TTL, JSON.stringify(responsePayload));
                        }
                    } catch (err) {
                        // Log without crashing
                    } finally {
                        if (redis && redis.status === 'ready') {
                            await redis.del(lockKey).catch(() => {});
                        }
                    }
                })();
            } else {
                if (redis && redis.status === 'ready') {
                    redis.del(lockKey).catch(() => {});
                }
            }

            return originalJson(body);
        };

        next();

    } catch (error) {
        console.error('[Idempotency Middleware Error]:', error.message);
        if (redis && redis.status === 'ready') await redis.del(lockKey).catch(() => {});
        next();
    }
};

module.exports = idempotencyMiddleware;