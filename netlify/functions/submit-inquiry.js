const { Client } = require('pg');

exports.handler = async (event, context) => {
  // CORS setup
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    const data = JSON.parse(event.body);
    const { type, name, phone, sector, region, budget, message } = data;

    if (!name || !phone || !message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Name, phone, and message are required.' })
      };
    }

    await client.connect();

    const query = `
      INSERT INTO inquiries (type, name, phone, sector, region, budget, message)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `;
    const values = [
      type || 'GENERAL',
      name,
      phone,
      sector || null,
      region || null,
      budget || null,
      message
    ];

    const res = await client.query(query, values);
    
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        message: 'Inquiry submitted successfully', 
        id: res.rows[0].id 
      })
    };
  } catch (err) {
    console.error('Error submitting inquiry:', err);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Internal Server Error' })
    };
  } finally {
    await client.end();
  }
};
