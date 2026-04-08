const path = require('path');
const { loadEnvFile, createClient } = require('./load-env');

loadEnvFile(path.resolve(__dirname, '..'));

async function checkDB() {
    const client = createClient();
    try {
        await client.connect();
        console.log('Connected to database');
        
        // List all tables
        const tables = await client.query(
            "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name"
        );
        console.log('\n=== TABLES ===');
        for (const t of tables.rows) {
            const cnt = await client.query('SELECT count(*) FROM "' + t.table_name + '"');
            console.log(t.table_name + ': ' + cnt.rows[0].count + ' rows');
        }

        // Check regions data
        console.log('\n=== REGIONS DATA ===');
        const regions = await client.query('SELECT * FROM regions ORDER BY sort_order');
        regions.rows.forEach(r => {
            console.log(JSON.stringify(r, null, 2));
        });

        // Check inquiries
        console.log('\n=== INQUIRIES DATA ===');
        const inquiries = await client.query('SELECT id, type, name, status, created_at FROM inquiries ORDER BY created_at DESC LIMIT 10');
        inquiries.rows.forEach(r => {
            console.log(JSON.stringify(r));
        });

        // Check inquiry pages
        console.log('\n=== INQUIRY PAGES ===');
        const pages = await client.query('SELECT * FROM inquiry_pages ORDER BY sort_order');
        pages.rows.forEach(r => {
            console.log(JSON.stringify(r, null, 2));
        });

        // Check inquiry fields
        console.log('\n=== INQUIRY FIELDS ===');
        const fields = await client.query('SELECT * FROM inquiry_fields ORDER BY page_id, sort_order');
        fields.rows.forEach(r => {
            console.log(JSON.stringify(r));
        });

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
    }
}

checkDB();
