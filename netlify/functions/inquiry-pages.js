const { Client } = require('pg');

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  }

  const dbUrl = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_fCkTeHDp69dB@ep-bold-scene-a1n3azr4-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
  const client = new Client({ connectionString: dbUrl });

  try {
    await client.connect();

    // Check for slug param
    const slug = event.queryStringParameters && event.queryStringParameters.slug;

    if (slug) {
      // Return single page with fields
      const pageRes = await client.query(
        'SELECT * FROM inquiry_pages WHERE slug = $1 AND is_active = true', [slug]
      );
      if (pageRes.rows.length === 0) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Page not found' }) };
      }
      const page = pageRes.rows[0];
      const fieldsRes = await client.query(
        'SELECT * FROM inquiry_fields WHERE page_id = $1 ORDER BY sort_order ASC', [page.id]
      );
      page.fields = fieldsRes.rows;
      return { statusCode: 200, headers, body: JSON.stringify(page) };
    }

    // Return all active pages (without fields for listing)
    const pagesRes = await client.query(
      'SELECT id, title, slug, subtitle, badge_text, inquiry_type, sort_order FROM inquiry_pages WHERE is_active = true ORDER BY sort_order ASC'
    );
    return { statusCode: 200, headers, body: JSON.stringify(pagesRes.rows) };

  } catch (err) {
    console.error('Error in inquiry-pages:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal Server Error' }) };
  } finally {
    await client.end();
  }
};
