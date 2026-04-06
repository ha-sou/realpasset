/**
 * Migration: Create inquiry_pages and inquiry_fields tables
 * Run: node scripts/migrate_inquiry_pages.js
 */
const { Client } = require('pg');

const dbUrl = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_fCkTeHDp69dB@ep-bold-scene-a1n3azr4-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function migrate() {
  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  console.log('🔧 Creating inquiry_pages table...');
  await client.query(`
    CREATE TABLE IF NOT EXISTS inquiry_pages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(200) NOT NULL,
      slug VARCHAR(100) UNIQUE NOT NULL,
      subtitle TEXT DEFAULT '',
      description TEXT DEFAULT '',
      badge_text VARCHAR(50) DEFAULT 'Contact',
      inquiry_type VARCHAR(20) DEFAULT 'GENERAL',
      is_active BOOLEAN DEFAULT true,
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

  console.log('🔧 Creating inquiry_fields table...');
  await client.query(`
    CREATE TABLE IF NOT EXISTS inquiry_fields (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      page_id UUID NOT NULL REFERENCES inquiry_pages(id) ON DELETE CASCADE,
      field_name VARCHAR(100) NOT NULL,
      field_label VARCHAR(200) NOT NULL,
      field_type VARCHAR(30) DEFAULT 'text',
      placeholder VARCHAR(300) DEFAULT '',
      is_required BOOLEAN DEFAULT true,
      options JSONB DEFAULT '[]',
      sort_order INTEGER DEFAULT 0
    );
  `);

  // Create indexes
  console.log('🔧 Creating indexes...');
  await client.query(`CREATE INDEX IF NOT EXISTS idx_inquiry_pages_slug ON inquiry_pages(slug);`);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_inquiry_fields_page_id ON inquiry_fields(page_id);`);

  // Seed: Default "상담 예약" page with fields matching current contact.html
  console.log('🌱 Seeding default contact page...');

  const existing = await client.query(`SELECT id FROM inquiry_pages WHERE slug = 'contact'`);
  if (existing.rows.length === 0) {
    const pageRes = await client.query(`
      INSERT INTO inquiry_pages (title, slug, subtitle, description, badge_text, inquiry_type, sort_order)
      VALUES ('상담 예약', 'contact', '투자의 막연한 불안을 명확한 확신으로', '전문가와 함께하는 대면 상담을 지금 바로 신청하세요.', 'Contact Us', 'GENERAL', 1)
      RETURNING id
    `);
    const pageId = pageRes.rows[0].id;

    const fields = [
      { name: 'name', label: '성명', type: 'text', placeholder: '이름을 입력해주세요', required: true, sort: 1 },
      { name: 'phone', label: '연락처', type: 'tel', placeholder: '010-0000-0000', required: true, sort: 2 },
      { name: 'sector', label: '관심 지역/분야', type: 'select', placeholder: '분야를 선택해주세요', required: true, sort: 3, options: [
        '명동/도심권 소액 투자',
        '용산 글로벌 중심지 투자',
        '마포 미래 가치 거점 투자',
        '기타 자산 포트폴리오 상담'
      ]},
      { name: 'message', label: '상담 내용', type: 'textarea', placeholder: '궁금하신 점이나 현재 고민이신 부분을 자유롭게 남겨주세요.', required: true, sort: 4 }
    ];

    for (const f of fields) {
      await client.query(
        `INSERT INTO inquiry_fields (page_id, field_name, field_label, field_type, placeholder, is_required, options, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [pageId, f.name, f.label, f.type, f.placeholder, f.required, JSON.stringify(f.options || []), f.sort]
      );
    }
    console.log('✅ Default contact page seeded with 4 fields.');
  } else {
    console.log('ℹ️  Default contact page already exists, skipping seed.');
  }

  console.log('✅ Migration complete!');
  await client.end();
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
