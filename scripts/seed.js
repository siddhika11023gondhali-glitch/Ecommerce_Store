/**
 * SaMaa'S Collection - Database Initializer & Seeder Script
 * Run with: npm run db:init
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

async function runSeed() {
  console.log('\n🌸 ========================================================');
  console.log('   SaMaa\'S Collection — Database Initialization Script');
  console.log('========================================================\n');

  const host = process.env.DB_HOST || '127.0.0.1';
  const port = parseInt(process.env.DB_PORT, 10) || 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'samaas_collection';

  console.log(`Connecting to MySQL at ${host}:${port} as user "${user}"...`);

  let rootConnection;
  try {
    rootConnection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      multipleStatements: true
    });
    console.log('✅ Connected to MySQL server.');
  } catch (err) {
    console.error('❌ Could not connect to MySQL server.');
    console.error(`   Error code: ${err.code || 'UNKNOWN'}`);
    console.error(`   Message: ${err.message}`);
    console.error('\n⚠️  Please make sure:');
    console.error('   1. MySQL Server is running.');
    console.error('   2. The DB_PASSWORD in your .env file matches your MySQL root password.');
    console.error('   3. Port 3306 is open and accessible.\n');
    process.exit(1);
  }

  try {
    // 1. Create Database if it does not exist
    console.log(`\n1. Creating database "${database}" if not exists...`);
    await rootConnection.query(
      `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
    await rootConnection.query(`USE \`${database}\`;`);
    console.log(`✅ Database "${database}" is ready.`);

    // 2. Read and execute schema.sql
    console.log('\n2. Executing schema.sql to create relational tables...');
    const schemaPath = path.join(__dirname, '..', 'sql', 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`schema.sql not found at ${schemaPath}`);
    }
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await rootConnection.query(schemaSql);
    console.log('✅ Tables created: users, products, cart_items, orders, order_items, sessions.');

    // 3. Read and execute seed.sql
    console.log('\n3. Seeding catalog products from seed.sql...');
    const seedPath = path.join(__dirname, '..', 'sql', 'seed.sql');
    if (!fs.existsSync(seedPath)) {
      throw new Error(`seed.sql not found at ${seedPath}`);
    }
    const seedSql = fs.readFileSync(seedPath, 'utf8');
    await rootConnection.query(seedSql);
    
    const [productsCount] = await rootConnection.query('SELECT COUNT(*) as count FROM products');
    console.log(`✅ Successfully seeded ${productsCount[0].count} sample products!`);

    // 4. Create default Demo Admin and Demo Customer if they do not exist
    console.log('\n4. Setting up default user accounts...');
    
    // Admin
    const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@samaascollection.com';
    const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@12345';
    const adminName = process.env.DEFAULT_ADMIN_NAME || 'Admin SaMaa';

    const [existingAdmin] = await rootConnection.query(
      'SELECT id FROM users WHERE email = ?',
      [adminEmail]
    );

    if (existingAdmin.length === 0) {
      const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);
      await rootConnection.query(
        'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [adminName, adminEmail, hashedAdminPassword, 'admin']
      );
      console.log(`   👑 Admin account created:`);
      console.log(`      Email:    ${adminEmail}`);
      console.log(`      Password: ${adminPassword}`);
    } else {
      console.log(`   👑 Admin account (${adminEmail}) already exists.`);
    }

    // Customer
    const customerEmail = 'customer@samaascollection.com';
    const customerPassword = 'Customer@123';
    const customerName = 'Priya Sharma';

    const [existingCustomer] = await rootConnection.query(
      'SELECT id FROM users WHERE email = ?',
      [customerEmail]
    );

    if (existingCustomer.length === 0) {
      const hashedCustomerPassword = await bcrypt.hash(customerPassword, 10);
      await rootConnection.query(
        'INSERT INTO users (name, email, password_hash, role, phone, address) VALUES (?, ?, ?, ?, ?, ?)',
        [customerName, customerEmail, hashedCustomerPassword, 'customer', '+91 9876543210', 'Rajarampuri, Kolhapur, Maharashtra 416008']
      );
      console.log(`   🛍️  Demo Customer created:`);
      console.log(`      Email:    ${customerEmail}`);
      console.log(`      Password: ${customerPassword}`);
    } else {
      console.log(`   🛍️  Demo Customer (${customerEmail}) already exists.`);
    }

    console.log('\n✨ Database setup complete! You are ready to run:');
    console.log('   npm start\n');

  } catch (err) {
    console.error('❌ Database initialization error:', err.message);
    process.exit(1);
  } finally {
    if (rootConnection) {
      await rootConnection.end();
    }
  }
}

runSeed();
