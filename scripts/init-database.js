#!/usr/bin/env node

/**
 * Database initialization script for CRM Basic
 * This script creates the database and runs the setup SQL
 */

import dotenv from 'dotenv';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database configuration
const config = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  user: process.env.POSTGRES_USER || 'postgres',
  password: String(process.env.POSTGRES_PASSWORD || ''),
};

const targetDatabase = process.env.POSTGRES_DB || 'crmbasic';

async function createDatabase() {
  console.log('🔄 Starting database initialization...');
  
  // First, connect to postgres database to create our target database
  const adminPool = new Pool({
    ...config,
    database: 'postgres'
  });

  try {
    console.log('🔍 Checking if database exists...');
    
    // Check if database exists
    const dbCheckResult = await adminPool.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [targetDatabase]
    );

    if (dbCheckResult.rows.length === 0) {
      console.log(`📦 Creating database: ${targetDatabase}`);
      await adminPool.query(`CREATE DATABASE ${targetDatabase}`);
      console.log('✅ Database created successfully');
    } else {
      console.log(`✅ Database ${targetDatabase} already exists`);
    }
  } catch (error) {
    console.error('❌ Error creating database:', error.message);
    throw error;
  } finally {
    await adminPool.end();
  }
}

async function runSetupScript() {
  console.log('🔄 Running database setup script...');
  
  // Connect to our target database
  const pool = new Pool({
    ...config,
    database: targetDatabase
  });

  try {
    // Read the setup SQL file
    const setupSqlPath = path.join(__dirname, 'setup-crmbasic-database.sql');
    const setupSql = fs.readFileSync(setupSqlPath, 'utf8');

    console.log('📄 Executing setup script...');
    await pool.query(setupSql);
    console.log('✅ Database setup completed successfully');

    // Test the setup by counting records
    const orgCount = await pool.query('SELECT COUNT(*) as count FROM organizations');
    const userCount = await pool.query('SELECT COUNT(*) as count FROM users');
    const leadCount = await pool.query('SELECT COUNT(*) as count FROM leads');

    console.log(`📊 Database initialized with:`);
    console.log(`   - ${orgCount.rows[0].count} organizations`);
    console.log(`   - ${userCount.rows[0].count} users`);
    console.log(`   - ${leadCount.rows[0].count} leads`);

    // Display sample login credentials
    const sampleUsers = await pool.query(`
      SELECT email, name, role FROM users 
      WHERE email IN ('admin@crmbasic.com', 'sales@crmbasic.com', 'rep@crmbasic.com')
      ORDER BY role
    `);

    if (sampleUsers.rows.length > 0) {
      console.log(`\n🔑 Sample login credentials (password: 'password123' for all):`);
      sampleUsers.rows.forEach(user => {
        console.log(`   - ${user.email} (${user.role})`);
      });
    }

  } catch (error) {
    console.error('❌ Error running setup script:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

async function main() {
  try {
    await createDatabase();
    await runSetupScript();
    console.log('\n🎉 Database initialization completed successfully!');
    console.log(`\n📌 Don't forget to:`);
    console.log(`   1. Copy .env.example to .env`);
    console.log(`   2. Update the database credentials in .env`);
    console.log(`   3. Run 'npm run dev:start' to start the application`);
  } catch (error) {
    console.error('\n💥 Database initialization failed:', error.message);
    console.log(`\n🔧 Troubleshooting:`);
    console.log(`   1. Make sure PostgreSQL is running`);
    console.log(`   2. Verify database credentials in environment variables`);
    console.log(`   3. Check that the postgres user has database creation privileges`);
    process.exit(1);
  }
}

main();
