#!/usr/bin/env node

/**
 * Order Management Migration Script
 * This script adds the order management tables to the existing CRM database
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
  database: process.env.POSTGRES_DB || 'crmbasic'
};

async function runOrderMigration() {
  console.log('🔄 Running order management migration...');
  
  const pool = new Pool(config);

  try {
    // Read the migration SQL file
    const migrationSqlPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250101000005_create_order_management_tables.sql');
    const migrationSql = fs.readFileSync(migrationSqlPath, 'utf8');

    console.log('📄 Executing order management migration...');
    await pool.query(migrationSql);
    console.log('✅ Order management migration completed successfully');

    // Test the migration by checking tables
    console.log('🔍 Verifying created tables...');
    
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('products', 'customers', 'orders', 'order_items')
      ORDER BY table_name
    `);

    console.log(`📊 Order management tables created:`);
    tablesResult.rows.forEach(table => {
      console.log(`   - ${table.table_name}`);
    });

    // Check if users table exists for authentication
    const usersResult = await pool.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'users'
    `);

    if (usersResult.rows[0].count > 0) {
      console.log('✅ Users table found - authentication ready');
    } else {
      console.log('⚠️  Users table not found - you may need to run the main database setup first');
    }

  } catch (error) {
    console.error('❌ Error running order migration:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

async function main() {
  try {
    await runOrderMigration();
    console.log('\n🎉 Order management migration completed successfully!');
    console.log(`\n📌 You can now:`);
    console.log(`   1. Start the server: npm run server`);
    console.log(`   2. Start the frontend: npm run dev`);
    console.log(`   3. Access order creation at: http://localhost:5173/create-order`);
  } catch (error) {
    console.error('\n💥 Order migration failed:', error.message);
    console.log(`\n🔧 Troubleshooting:`);
    console.log(`   1. Make sure PostgreSQL is running`);
    console.log(`   2. Verify database credentials in .env`);
    console.log(`   3. Ensure the crmbasic database exists`);
    console.log(`   4. Run 'npm run init:db' first if tables don't exist`);
    process.exit(1);
  }
}

main();
