/**
 * SaMaa'S Collection - MySQL Database Configuration & Pool Manager
 * Uses mysql2/promise for async/await parameterized queries.
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'samaas_collection',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  multipleStatements: true,
  decimalNumbers: true
};

let pool;
let isConnected = false;

try {
  pool = mysql.createPool(dbConfig);
} catch (err) {
  console.error('⚠️  Failed to create MySQL connection pool:', err.message);
}

/**
 * Tests database connectivity on application startup.
 * @returns {Promise<boolean>}
 */
async function testConnection() {
  if (!pool) return false;
  try {
    const connection = await pool.getConnection();
    await connection.query('SELECT 1');
    connection.release();
    isConnected = true;
    console.log(`✅ Successfully connected to MySQL database: "${dbConfig.database}" on ${dbConfig.host}:${dbConfig.port}`);
    return true;
  } catch (error) {
    isConnected = false;
    console.error('\n===============================================================');
    console.error('❌ MySQL Connection Failed:');
    console.error(`   Message: ${error.message}`);
    console.error('---------------------------------------------------------------');
    console.error('💡 Quick Troubleshooting Steps:');
    console.error('   1. Ensure MySQL Server is running (e.g., Services app or MySQL Workbench).');
    console.error('   2. Verify credentials in your .env file (DB_USER, DB_PASSWORD, DB_PORT).');
    console.error('   3. Run `npm run db:init` to automatically create the database and seed tables.');
    console.error('===============================================================\n');
    return false;
  }
}

/**
 * Helper to execute parameterized queries.
 * @param {string} sql - SQL query with `?` placeholders.
 * @param {Array} params - Values to safely bind.
 */
async function query(sql, params = []) {
  if (!pool) {
    throw new Error('Database pool is not initialized. Please verify MySQL configuration.');
  }
  const [rows] = await pool.execute(sql, params);
  return rows;
}

module.exports = {
  pool,
  query,
  testConnection,
  getIsConnected: () => isConnected,
  dbConfig
};
