const { createDbClient } = require('./utils/db');

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  const client = createDbClient();

  try {
    await client.connect();

    // ─── GET: List all pages with their fields ───
    if (event.httpMethod === 'GET') {
      const pagesRes = await client.query('SELECT * FROM inquiry_pages ORDER BY sort_order ASC, created_at ASC');
      const fieldsRes = await client.query('SELECT * FROM inquiry_fields ORDER BY sort_order ASC');

      const pages = pagesRes.rows.map(page => ({
        ...page,
        fields: fieldsRes.rows.filter(f => f.page_id === page.id)
      }));

      return { statusCode: 200, headers, body: JSON.stringify(pages) };
    }

    const body = JSON.parse(event.body || '{}');

    // ─── POST: Create page or field ───
    if (event.httpMethod === 'POST') {
      if (body.action === 'create_field') {
        const { page_id, field_name, field_label, field_type, placeholder, is_required, options, sort_order } = body;
        const res = await client.query(
          `INSERT INTO inquiry_fields (page_id, field_name, field_label, field_type, placeholder, is_required, options, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
          [page_id, field_name, field_label, field_type || 'text', placeholder || '', is_required !== false, JSON.stringify(options || []), sort_order || 0]
        );
        return { statusCode: 200, headers, body: JSON.stringify(res.rows[0]) };
      }

      // Create page
      const { title, slug, subtitle, description, badge_text, inquiry_type, is_active, sort_order } = body;
      if (!title || !slug) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Title and slug are required' }) };
      }
      const res = await client.query(
        `INSERT INTO inquiry_pages (title, slug, subtitle, description, badge_text, inquiry_type, is_active, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [title, slug, subtitle || '', description || '', badge_text || 'Contact', inquiry_type || 'GENERAL', is_active !== false, sort_order || 0]
      );
      return { statusCode: 200, headers, body: JSON.stringify(res.rows[0]) };
    }

    // ─── PATCH: Update page or field ───
    if (event.httpMethod === 'PATCH') {
      if (body.action === 'update_field') {
        const { id, field_name, field_label, field_type, placeholder, is_required, options, sort_order } = body;
        if (!id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Field ID required' }) };

        const sets = [];
        const vals = [];
        let idx = 1;

        if (field_name !== undefined)  { sets.push(`field_name = $${idx++}`); vals.push(field_name); }
        if (field_label !== undefined) { sets.push(`field_label = $${idx++}`); vals.push(field_label); }
        if (field_type !== undefined)  { sets.push(`field_type = $${idx++}`); vals.push(field_type); }
        if (placeholder !== undefined) { sets.push(`placeholder = $${idx++}`); vals.push(placeholder); }
        if (is_required !== undefined) { sets.push(`is_required = $${idx++}`); vals.push(is_required); }
        if (options !== undefined)     { sets.push(`options = $${idx++}`); vals.push(JSON.stringify(options)); }
        if (sort_order !== undefined)  { sets.push(`sort_order = $${idx++}`); vals.push(sort_order); }

        if (sets.length === 0) return { statusCode: 400, headers, body: JSON.stringify({ error: 'No fields to update' }) };

        vals.push(id);
        await client.query(`UPDATE inquiry_fields SET ${sets.join(', ')} WHERE id = $${idx}`, vals);
        return { statusCode: 200, headers, body: JSON.stringify({ message: 'Field updated' }) };
      }

      // Update page
      const { id, title, slug, subtitle, description, badge_text, inquiry_type, is_active, sort_order } = body;
      if (!id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Page ID required' }) };

      const sets = [];
      const vals = [];
      let idx = 1;

      if (title !== undefined)        { sets.push(`title = $${idx++}`); vals.push(title); }
      if (slug !== undefined)         { sets.push(`slug = $${idx++}`); vals.push(slug); }
      if (subtitle !== undefined)     { sets.push(`subtitle = $${idx++}`); vals.push(subtitle); }
      if (description !== undefined)  { sets.push(`description = $${idx++}`); vals.push(description); }
      if (badge_text !== undefined)   { sets.push(`badge_text = $${idx++}`); vals.push(badge_text); }
      if (inquiry_type !== undefined) { sets.push(`inquiry_type = $${idx++}`); vals.push(inquiry_type); }
      if (is_active !== undefined)    { sets.push(`is_active = $${idx++}`); vals.push(is_active); }
      if (sort_order !== undefined)   { sets.push(`sort_order = $${idx++}`); vals.push(sort_order); }

      sets.push(`updated_at = NOW()`);

      if (sets.length === 1) return { statusCode: 400, headers, body: JSON.stringify({ error: 'No fields to update' }) };

      vals.push(id);
      await client.query(`UPDATE inquiry_pages SET ${sets.join(', ')} WHERE id = $${idx}`, vals);
      return { statusCode: 200, headers, body: JSON.stringify({ message: 'Page updated' }) };
    }

    // ─── DELETE: Delete page or field ───
    if (event.httpMethod === 'DELETE') {
      if (body.action === 'delete_field') {
        if (!body.id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Field ID required' }) };
        await client.query('DELETE FROM inquiry_fields WHERE id = $1', [body.id]);
        return { statusCode: 200, headers, body: JSON.stringify({ message: 'Field deleted' }) };
      }

      if (!body.id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Page ID required' }) };
      // Delete fields first, then page
      await client.query('DELETE FROM inquiry_fields WHERE page_id = $1', [body.id]);
      await client.query('DELETE FROM inquiry_pages WHERE id = $1', [body.id]);
      return { statusCode: 200, headers, body: JSON.stringify({ message: 'Page deleted' }) };
    }

    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  } catch (err) {
    console.error('Error in admin-inquiry-pages:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal Server Error: ' + err.message }) };
  } finally {
    await client.end();
  }
};
