const { Client } = require('pg');

const connectionString = 'postgresql://neondb_owner:npg_fCkTeHDp69dB@ep-bold-scene-a1n3azr4-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const sql = `
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inquiry_type') THEN
        CREATE TYPE inquiry_type AS ENUM ('GENERAL', 'INVESTMENT');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inquiry_status') THEN
        CREATE TYPE inquiry_status AS ENUM ('PENDING', 'CONTACTED', 'COMPLETED', 'CANCELLED');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'STAFF',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type inquiry_type NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    sector VARCHAR(100),
    region VARCHAR(100),
    budget VARCHAR(50),
    message TEXT NOT NULL,
    status inquiry_status DEFAULT 'PENDING',
    assigned_to UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_inquiries_status') THEN
        CREATE INDEX idx_inquiries_status ON inquiries(status);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_inquiries_type') THEN
        CREATE INDEX idx_inquiries_type ON inquiries(type);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_inquiries_created_at') THEN
        CREATE INDEX idx_inquiries_created_at ON inquiries(created_at);
    END IF;
END $$;
`;

async function sync() {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        console.log('Connected to database');
        await client.query(sql);
        console.log('Schema synchronization successful');
        
        const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log('Current tables:', res.rows.map(r => r.table_name).join(', '));
        
    } catch (err) {
        console.error('Error synchronizing schema:', err);
    } finally {
        await client.end();
    }
}

sync();
