/**
 * Migration: Fix inquiries table for dynamic forms
 * - Make 'message' column nullable
 * - Change 'type' column to VARCHAR if it's ENUM (to support custom inquiry types)
 */
const path = require('path');
const { loadEnvFile, createClient } = require('./load-env');

loadEnvFile(path.resolve(__dirname, '..'));

async function migrate() {
  const client = createClient();
  await client.connect();

  try {
    // 1. Make message nullable
    console.log('🔧 Making message column nullable...');
    await client.query(`ALTER TABLE inquiries ALTER COLUMN message DROP NOT NULL`);
    console.log('✅ message column is now nullable');

    // 2. Check if type is ENUM and convert to VARCHAR
    console.log('🔧 Checking type column...');
    const typeCheck = await client.query(`
      SELECT data_type, udt_name FROM information_schema.columns 
      WHERE table_name = 'inquiries' AND column_name = 'type'
    `);
    
    if (typeCheck.rows.length > 0) {
      const { data_type, udt_name } = typeCheck.rows[0];
      console.log(`   Current type column: data_type=${data_type}, udt_name=${udt_name}`);
      
      if (data_type === 'USER-DEFINED') {
        console.log('🔧 Converting type column from ENUM to VARCHAR...');
        await client.query(`ALTER TABLE inquiries ALTER COLUMN type TYPE VARCHAR(50) USING type::text`);
        console.log('✅ type column converted to VARCHAR(50)');
      } else {
        console.log('✅ type column is already VARCHAR, no change needed');
      }
    }

    // 3. Set default for message
    console.log('🔧 Setting default for message column...');
    await client.query(`ALTER TABLE inquiries ALTER COLUMN message SET DEFAULT '-'`);
    console.log('✅ Default set for message column');

    console.log('\n✅ Migration complete!');
  } catch (err) {
    console.error('❌ Migration error:', err.message);
  } finally {
    await client.end();
  }
}

migrate();
