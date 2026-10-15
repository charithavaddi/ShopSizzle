// backend/src/services/redis.js
const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  lazyConnect: true, // Don't block startup
  retryStrategy(times) {
    if (times > 3) {
      console.warn('[Redis] Max retry attempts reached. Running without active Redis cache.');
      return null; // Stop retrying to avoid infinite loops
    }
    return Math.min(times * 100, 2000);
  },
});

redis.on('error', (err) => {
  console.error('[Redis Error]:', err.message);
});

module.exports = redis;