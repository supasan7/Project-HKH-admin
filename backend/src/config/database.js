const { Pool } = require('pg');
const env = require('./env');

const pool = new Pool(
    process.env.DATABASE_URL
        ? {
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false },
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 5000,
        }
        : {
            host: env.db.host,
            port: env.db.port,
            database: env.db.name,
            user: env.db.user,
            password: env.db.password,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        }
);

pool.on('error', (err) => {
    console.error('Unexpected error on idle database client', err);
    process.exit(-1);
});

// Helper: execute a query
const query = (text, params) => pool.query(text, params);

// Helper: get a client from pool (for transactions)
const getClient = () => pool.connect();

module.exports = { pool, query, getClient };
