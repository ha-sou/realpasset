const { Client } = require('pg');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  const dbUrl = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_fCkTeHDp69dB@ep-bold-scene-a1n3azr4-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

  const client = new Client({
    connectionString: dbUrl
  });

  try {
    await client.connect();

    // GET — 전체 권역 목록 (관리자용: 비활성 포함)
    if (event.httpMethod === 'GET') {
      const res = await client.query(
        'SELECT * FROM regions ORDER BY sort_order ASC, created_at ASC'
      );
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(res.rows)
      };
    }

    // POST — 새 권역 추가
    if (event.httpMethod === 'POST') {
      const { name, tag, description, image_url, region_key, sort_order, is_active } = JSON.parse(event.body);

      if (!name || !tag || !description || !region_key) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: '필수 항목을 모두 입력해주세요 (이름, 태그, 설명, 권역키)' })
        };
      }

      const res = await client.query(
        `INSERT INTO regions (name, tag, description, image_url, region_key, sort_order, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [name, tag, description, image_url || null, region_key, sort_order || 0, is_active !== false]
      );

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(res.rows[0])
      };
    }

    // PATCH — 권역 수정
    if (event.httpMethod === 'PATCH') {
      const { id, ...updates } = JSON.parse(event.body);

      if (!id) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'ID is required' }) };
      }

      const allowedFields = ['name', 'tag', 'description', 'image_url', 'region_key', 'sort_order', 'is_active'];
      const setClauses = [];
      const values = [];
      let paramIndex = 1;

      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key)) {
          setClauses.push(`${key} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      }

      if (setClauses.length === 0) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'No valid fields to update' }) };
      }

      setClauses.push(`updated_at = NOW()`);
      values.push(id);

      const query = `UPDATE regions SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
      const res = await client.query(query, values);

      if (res.rows.length === 0) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Region not found' }) };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(res.rows[0])
      };
    }

    // DELETE — 권역 삭제
    if (event.httpMethod === 'DELETE') {
      const { id } = JSON.parse(event.body);

      if (!id) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'ID is required' }) };
      }

      const res = await client.query('DELETE FROM regions WHERE id = $1 RETURNING id', [id]);

      if (res.rows.length === 0) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Region not found' }) };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'Region deleted successfully' })
      };
    }

    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  } catch (err) {
    console.error('Error in admin-regions function:', err);

    // Handle unique constraint violation
    if (err.code === '23505') {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({ error: '이미 존재하는 권역키입니다. 다른 키를 사용해주세요.' })
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal Server Error' })
    };
  } finally {
    await client.end();
  }
};
