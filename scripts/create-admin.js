/**
 * SaMaa'S Collection - Safe Admin Account Creation Script
 * Usage:
 *   node scripts/create-admin.js "Admin Name" "admin@example.com" "SecurePassword123"
 * Or run interactively:
 *   npm run create-admin
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function createAdmin() {
  console.log('\n👑 ========================================================');
  console.log('   SaMaa\'S Collection — Create Admin Account');
  console.log('========================================================\n');

  const args = process.argv.slice(2);
  let name = args[0];
  let email = args[1];
  let password = args[2];

  if (!name || !email || !password) {
    console.log('Please provide admin credentials:\n');
    name = name || (await askQuestion('Admin Full Name: ')).trim();
    email = email || (await askQuestion('Admin Email Address: ')).trim();
    password = password || (await askQuestion('Admin Password (min 6 chars): ')).trim();
  }

  rl.close();

  if (!name || !email || !password) {
    console.error('❌ Error: Name, email, and password are all required.');
    process.exit(1);
  }

  if (password.length < 6) {
    console.error('❌ Error: Password must be at least 6 characters long.');
    process.exit(1);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.error('❌ Error: Please provide a valid email address.');
    process.exit(1);
  }

  const host = process.env.DB_HOST || '127.0.0.1';
  const port = parseInt(process.env.DB_PORT, 10) || 3306;
  const user = process.env.DB_USER || 'root';
  const dbPassword = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'samaas_collection';

  let connection;
  try {
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password: dbPassword,
      database
    });

    // Check if user already exists
    const [existing] = await connection.query('SELECT id, role FROM users WHERE email = ?', [email]);
    const hashedPassword = await bcrypt.hash(password, 10);

    if (existing.length > 0) {
      // Update user to admin role with new password
      await connection.query(
        'UPDATE users SET name = ?, password_hash = ?, role = ? WHERE email = ?',
        [name, hashedPassword, 'admin', email]
      );
      console.log(`\n✅ Existing user "${email}" has been successfully updated to ADMIN role!`);
    } else {
      // Insert new admin
      await connection.query(
        'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [name, email, hashedPassword, 'admin']
      );
      console.log(`\n✅ Admin account "${email}" has been successfully created!`);
    }

    console.log(`\n🎉 You can now log in at http://localhost:${process.env.PORT || 3000}/login.html`);
    console.log(`   and access the Admin Dashboard at http://localhost:${process.env.PORT || 3000}/admin.html\n`);

  } catch (err) {
    console.error('\n❌ Failed to create admin user:', err.message);
    if (err.code === 'ER_BAD_DB_ERROR') {
      console.error('💡 Hint: The database does not exist yet. Run `npm run db:init` first.');
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createAdmin();
