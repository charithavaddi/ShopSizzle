/**
 * =============================================================================
 * Database Configuration (backend/src/config/db.js)
 * PostgreSQL / Supabase Connection Pool
 * =============================================================================
 */

const { Pool } = require('pg');

// Create a connection pool using environment variables or a direct connection string
const pool = new Pool(
    process.env.DATABASE_URL
        ? {
              connectionString: process.env.DATABASE_URL,
              ssl:
                  process.env.NODE_ENV === 'production'
                      ? { rejectUnauthorized: false }
                      : false
          }
        : {
              user: process.env.DB_USER || 'postgres',
              host: process.env.DB_HOST || 'localhost',
              database: process.env.DB_NAME || 'fincommerce',
              password: process.env.DB_PASSWORD || 'postgres',
              port: parseInt(process.env.DB_PORT, 10) || 5432,
              max: 20, // Maximum pool size
              idleTimeoutMillis: 30000, // Close idle clients after 30s
              connectionTimeoutMillis: 2000 // Return an error after 2s if connection fails
          }
);

// Event listener for unexpected connection pool errors
pool.on('error', (err) => {
    console.error('[PostgreSQL Pool Error]: Unexpected error on idle client:', err.message);
});

module.exports = {
    /**
     * Helper query method to execute SQL queries with parameters
     * @param {string} text - SQL Query String
     * @param {Array} params - Query Parameters
     */
    query: (text, params) => pool.query(text, params),

    /**
     * Get a raw client from the pool for manual transactions (BEGIN/COMMIT/ROLLBACK)
     */
    getClient: () => pool.connect(),

    /**
     * Direct reference to the pool instance
     */
    pool
};