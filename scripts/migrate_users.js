const { Client } = require('pg');

const connectionString = 'postgresql://neondb_owner:npg_fCkTeHDp69dB@ep-bold-scene-a1n3azr4-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function migrate() {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        console.log('Connected for migration');
        
        // Add password_hash column if it doesn't exist
        await client.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255),
            ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;
        `);
        
        console.log('Users table migrated successfully');
    } catch (err) {
        console.error('Error during migration:', err);
    } finally {
        await client.end();
    }
}

migrate();
