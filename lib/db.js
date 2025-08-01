// lib/db.js
import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 5, // Reduced from 10 to be more conservative
  queueLimit: 0,
  acquireTimeout: 60000, // Wait max 60 seconds for a connection
  timeout: 60000, // Query timeout
  idleTimeout: 600000, // 10 minutes - close idle connections
  maxIdle: 2, // Maximum idle connections to maintain
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// Wrapper function to ensure connections are always released
export const executeQuery = async (query, params = []) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.execute(query, params);
    return rows;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  } finally {
    if (connection) {
      connection.release(); // Always release connection back to pool
    }
  }
};

// For transactions
export const executeTransaction = async (queries) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const results = [];
    for (const { query, params } of queries) {
      const [rows] = await connection.execute(query, params);
      results.push(rows);
    }

    await connection.commit();
    return results;
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error("Transaction error:", error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// Graceful shutdown
export const closePool = async () => {
  try {
    await pool.end();
    console.log("Database pool closed");
  } catch (error) {
    console.error("Error closing database pool:", error);
  }
};

// Handle process termination
process.on("SIGINT", async () => {
  console.log("Shutting down gracefully...");
  await closePool();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Shutting down gracefully...");
  await closePool();
  process.exit(0);
});

export default pool;
