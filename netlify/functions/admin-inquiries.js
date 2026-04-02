const { Client } = require('pg');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();

    if (event.httpMethod === 'GET') {
      const res = await client.query('SELECT * FROM inquiries ORDER BY created_at DESC');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(res.rows)
      };
    } else if (event.httpMethod === 'PATCH') {
      const { id, status } = JSON.parse(event.body);
      if (!id || !status) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'ID and status are required' }) };
      }
      
      await client.query(
        'UPDATE inquiries SET status = $1, updated_at = NOW() WHERE id = $2',
        [status, id]
      );
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'Status updated successfully' })
      };
    }

    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  } catch (err) {
    console.error('Error in admin-inquiries function:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal Server Error' })
    };
  } finally {
    await client.end();
  }
};
