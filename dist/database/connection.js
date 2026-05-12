"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.query = query;
exports.getClient = getClient;
exports.withTransaction = withTransaction;
exports.checkDatabaseHealth = checkDatabaseHealth;
exports.closePool = closePool;
const pg_1 = require("pg");
const config_1 = require("../config");
// Create PostgreSQL connection pool
const pool = new pg_1.Pool({
    host: config_1.config.db.host,
    port: config_1.config.db.port,
    database: config_1.config.db.name,
    user: config_1.config.db.user,
    password: config_1.config.db.password,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});
exports.pool = pool;
// Log connection events
pool.on("connect", () => {
    console.log("Database client connected");
});
pool.on("error", (err) => {
    console.error("Unexpected database error:", err);
    process.exit(-1);
});
// Query helper function
async function query(text, params) {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        if (config_1.config.nodeEnv === "development") {
            console.log("Query executed:", {
                text: text.substring(0, 50),
                duration,
                rows: result.rowCount,
            });
        }
        return result;
    }
    catch (error) {
        console.error("Database query error:", error);
        throw error;
    }
}
// Get a client from pool for transactions
async function getClient() {
    const client = await pool.connect();
    const originalQuery = client.query.bind(client);
    const originalRelease = client.release.bind(client);
    // Track if client is released
    let released = false;
    // Override query to track last query
    const query = async (text, params) => {
        return originalQuery(text, params);
    };
    // Override release to prevent double release
    const release = () => {
        if (released) {
            console.warn("Client already released");
            return;
        }
        released = true;
        return originalRelease();
    };
    return Object.assign(client, { query, release });
}
// Transaction helper
async function withTransaction(callback) {
    const client = await getClient();
    try {
        await client.query("BEGIN");
        const result = await callback(client);
        await client.query("COMMIT");
        return result;
    }
    catch (error) {
        await client.query("ROLLBACK");
        throw error;
    }
    finally {
        client.release();
    }
}
// Health check
async function checkDatabaseHealth() {
    try {
        await query("SELECT 1");
        return true;
    }
    catch {
        return false;
    }
}
// Close pool
async function closePool() {
    await pool.end();
    console.log("Database pool closed");
}
//# sourceMappingURL=connection.js.map