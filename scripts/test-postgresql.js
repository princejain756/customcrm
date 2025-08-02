import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function testPostgreSQLConnection() {
  const pool = new Pool({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5433'),
    database: process.env.POSTGRES_DB || 'scanbill_tally',
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || '',
  });

  try {
    console.log('🔍 Testing PostgreSQL connection...');
    
    // Test basic connection
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL successfully');
    
    // Test query
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ Query test successful:', result.rows[0].current_time);
    
    // Test schema
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('✅ Database schema test successful');
    console.log('📋 Available tables:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Test sample data
    const orgResult = await client.query('SELECT COUNT(*) as count FROM organisations');
    console.log(`✅ Sample data test: ${orgResult.rows[0].count} organisations found`);
    
    const profileResult = await client.query('SELECT COUNT(*) as count FROM profiles');
    console.log(`✅ Sample data test: ${profileResult.rows[0].count} profiles found`);
    
    client.release();
    console.log('✅ All tests passed! PostgreSQL migration is working correctly.');
    
  } catch (error) {
    console.error('❌ PostgreSQL connection test failed:', error.message);
    console.error('Please check your database configuration and ensure PostgreSQL is running.');
  } finally {
    await pool.end();
  }
}

// Run the test
testPostgreSQLConnection(); 