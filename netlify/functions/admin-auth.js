const { Client } = require('pg');
const crypto = require('crypto');

exports.handler = async (event, context) => {
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

  const dbUrl = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_fCkTeHDp69dB@ep-bold-scene-a1n3azr4-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

  const client = new Client({
    connectionString: dbUrl
  });

  try {
    const { email, password } = JSON.parse(event.body);
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

    await client.connect();

    const res = await client.query(
      'SELECT id, email, name, role FROM users WHERE email = $1 AND password_hash = $2',
      [email, passwordHash]
    );

    if (res.rows.length > 0) {
      const user = res.rows[0];
      // Update last login
      await client.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          success: true, 
          user: { id: user.id, email: user.email, name: user.name, role: user.role } 
        })
      };
    } else {
      return {
        statusCode: 401,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ success: false, message: 'Invalid email or password' })
      };
    }
  } catch (err) {
    console.error('Error during admin auth:', err);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Internal Server Error' })
    };
  } finally {
    await client.end();
  }
};
