/**
 * SaMaa'S Collection - Main Express Application Server
 * Full-Stack E-Commerce Platform
 */

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const path = require('path');
const { pool, testConnection, dbConfig } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// =============================================================================
// 1. Basic Security & Body Parsing Middleware
// =============================================================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Defense-in-depth standard HTTP security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// =============================================================================
// 2. Session Configuration with MySQL Store (Resilient Fallback)
// =============================================================================
let sessionStore;
try {
  // express-mysql-session options using our existing connection configuration
  const sessionOptions = {
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.database,
    clearExpired: true,
    checkExpirationInterval: 900000, // 15 mins
    expiration: 86400000,            // 24 hours
    createDatabaseTable: true,
    schema: {
      tableName: 'sessions',
      columnNames: {
        session_id: 'session_id',
        expires: 'expires',
        data: 'data'
      }
    }
  };
  sessionStore = new MySQLStore(sessionOptions);
  sessionStore.on('error', (storeErr) => {
    // Gracefully report session store errors without terminating Express
    console.warn('⚠️  MySQL Session Store Notice:', storeErr.message);
  });
} catch (err) {
  console.warn('⚠️  Could not initialize MySQL session store, falling back to memory store:', err.message);
}

const isProduction = process.env.NODE_ENV === 'production';

app.use(
  session({
    key: 'samaas.sid',
    secret: process.env.SESSION_SECRET || 'samaas_collection_dev_secret_key_change_in_production_8921',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction, // HTTPS only in production
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  })
);

// =============================================================================
// 3. Static Assets (Public Directory)
// =============================================================================
app.use(express.static(path.join(__dirname, 'public')));

// =============================================================================
// 4. API Routes Mounting
// =============================================================================
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

/**
 * Health check & diagnostics endpoint
 */
app.get('/api/health', async (req, res) => {
  let dbStatus = 'Disconnected';
  try {
    const conn = await pool.getConnection();
    await conn.query('SELECT 1');
    conn.release();
    dbStatus = 'Connected';
  } catch (err) {
    dbStatus = `Error: ${err.message}`;
  }

  res.json({
    status: 'online',
    appName: "SaMaa'S Collection",
    version: '1.0.0',
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// =============================================================================
// 5. 404 Handler for Unmatched API Requests
// =============================================================================
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.method} ${req.originalUrl} not found.`
  });
});

// Fallback to index.html for root path or SPA navigation if needed
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// =============================================================================
// 6. Centralized Error Handling Middleware
// =============================================================================
app.use((err, req, res, next) => {
  console.error(`💥 [Error] ${req.method} ${req.url}:`, err.message);

  // Avoid leaking database connection strings or internals to client
  let userFriendlyMessage = 'An unexpected server error occurred. Please try again.';
  let statusCode = err.status || 500;

  if (err.code === 'ECONNREFUSED' || err.code === 'ER_ACCESS_DENIED_ERROR' || err.code === 'ER_BAD_DB_ERROR') {
    userFriendlyMessage = 'Database connection is temporarily unavailable. Please check MySQL server and .env configuration.';
    statusCode = 503;
  } else if (err.message && !isProduction) {
    userFriendlyMessage = err.message;
  }

  res.status(statusCode).json({
    success: false,
    message: userFriendlyMessage
  });
});

// =============================================================================
// 7. Server Boot
// =============================================================================
app.listen(PORT, async () => {
  console.log('\n🌸 ===============================================================');
  console.log(`   SaMaa'S Collection E-Commerce Server`);
  console.log(`   Listening at: http://localhost:${PORT}`);
  console.log('===============================================================');

  // Test database connection on startup
  await testConnection();
});
