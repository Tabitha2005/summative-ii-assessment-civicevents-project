// seed-admin.js — run once: node seed-admin.js
// Creates the default admin account if it doesn't already exist.

import bcrypt from 'bcrypt';
import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
});

const ADMIN_EMAIL    = 'admin@civicevents.com';
const ADMIN_PASSWORD = 'Admin@1234';   // meets: 8+ chars, upper, lower, number, special
const ADMIN_NAME     = 'CivicEvents Admin';

async function seed() {
  const client = await pool.connect();
  try {
    // Check if admin already exists
    const existing = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [ADMIN_EMAIL]
    );

    if (existing.rows.length > 0) {
      console.log(`✅ Admin already exists: ${ADMIN_EMAIL}`);
      return;
    }

    const password_hash = await bcrypt.hash(ADMIN_PASSWORD, 10);

    await client.query(
      `INSERT INTO users (full_name, email, password_hash, role, is_active)
       VALUES ($1, $2, $3, 'admin', true)`,
      [ADMIN_NAME, ADMIN_EMAIL, password_hash]
    );

    console.log('✅ Admin user created successfully!');
    console.log('   Email   :', ADMIN_EMAIL);
    console.log('   Password:', ADMIN_PASSWORD);
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
