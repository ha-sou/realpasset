const path = require('path');
const { loadEnvFile, createClient } = require('./load-env');

loadEnvFile(path.resolve(__dirname, '..'));

async function migrate() {
    const client = createClient();
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
