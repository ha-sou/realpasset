const { createDbClient } = require('./utils/db');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  }

  const client = createDbClient();

  try {
    await client.connect();

    const res = await client.query(
      'SELECT id, name, tag, description, image_url, region_key, sort_order FROM regions WHERE is_active = true ORDER BY sort_order ASC'
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(res.rows)
    };
  } catch (err) {
    console.error('Error fetching regions:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal Server Error' })
    };
  } finally {
    await client.end();
  }
};
