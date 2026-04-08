const { createDbClient } = require('./utils/db');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: 'Method Not Allowed' };
  }

  const client = createDbClient();

  try {
    const data = JSON.parse(event.body);
    const { type, name, phone, sector, region, budget, message, ...extraFields } = data;

    if (!name || !phone) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: '성명과 연락처는 필수 항목입니다.' })
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
      message || JSON.stringify(extraFields) || '-'
    ];

    const res = await client.query(query, values);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        message: 'Inquiry submitted successfully',
        id: res.rows[0].id
      })
    };
  } catch (err) {
    console.error('Error submitting inquiry:', err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal Server Error' })
    };
  } finally {
    await client.end();
  }
};
