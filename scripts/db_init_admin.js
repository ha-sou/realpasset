const { Client } = require('pg');
const crypto = require('crypto');

// SHA-256 hash for 's8888885!'
const passwordHash = crypto.createHash('sha256').update('s8888885!').digest('hex');

const connectionString = 'postgresql://neondb_owner:npg_fCkTeHDp69dB@ep-bold-scene-a1n3azr4-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function initAdmin() {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        
        // Ensure users table exists (if not already synced)
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                email VARCHAR(255) UNIQUE NOT NULL,
                name VARCHAR(100) NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(20) DEFAULT 'STAFF',
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);

        // Check if admin already exists
        const checkRes = await client.query('SELECT * FROM users WHERE email = $1', ['realpasset']);
        
        if (checkRes.rows.length === 0) {
            await client.query(
                'INSERT INTO users (email, name, password_hash, role) VALUES ($1, $2, $3, $4)',
                ['realpasset', '관리자', passwordHash, 'ADMIN']
            );
            console.log('Admin user created: realpasset / s8888885!');
        } else {
            // Update password for existing user
            await client.query(
                'UPDATE users SET password_hash = $1 WHERE email = $2',
                [passwordHash, 'realpasset']
            );
            console.log('Admin user updated: realpasset / s8888885!');
        }
    } catch (err) {
        console.error('Error initializing admin:', err);
    } finally {
        await client.end();
    }
}

initAdmin();
