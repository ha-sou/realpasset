const path = require('path');
const { loadEnvFile, createClient } = require('./load-env');

loadEnvFile(path.resolve(__dirname, '..'));

const sql = `
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inquiry_status') THEN
        CREATE TYPE inquiry_status AS ENUM ('PENDING', 'CONTACTED', 'COMPLETED', 'CANCELLED');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255),
    role VARCHAR(20) DEFAULT 'STAFF',
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    sector VARCHAR(100),
    region VARCHAR(100),
    budget VARCHAR(50),
    message TEXT DEFAULT '-',
    status inquiry_status DEFAULT 'PENDING',
    assigned_to UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS regions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    tag VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    image_url VARCHAR(500),
    region_key VARCHAR(50) UNIQUE NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

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

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_inquiries_status') THEN
        CREATE INDEX idx_inquiries_status ON inquiries(status);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_inquiries_created_at') THEN
        CREATE INDEX idx_inquiries_created_at ON inquiries(created_at);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_regions_sort_order') THEN
        CREATE INDEX idx_regions_sort_order ON regions(sort_order);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_inquiry_pages_slug') THEN
        CREATE INDEX idx_inquiry_pages_slug ON inquiry_pages(slug);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_inquiry_fields_page_id') THEN
        CREATE INDEX idx_inquiry_fields_page_id ON inquiry_fields(page_id);
    END IF;
END $$;
`;

const seedRegions = `
INSERT INTO regions (name, tag, description, image_url, region_key, sort_order, is_active)
SELECT * FROM (VALUES
    ('공덕 권역', 'Business Hub', '사통팔달 교통의 요지, 안정적인 오피스 배후 수요와 고소득 직장인 거주지의 완벽한 조화', 'assets/gongdeok.png', '공덕', 1, true),
    ('천호 권역', 'Riverside Growth', '한강 변 대규모 정비사업과 상업지구 고도화로 재탄생하는 동남권 신흥 거점', 'assets/cheonho.png', '천호', 2, true),
    ('용산 권역', 'Global Future', '국제업무지구와 국가공원 조성, 대한민국 부동산의 미래가 결정되는 글로벌 핵심축', 'assets/yongsan.png', '용산', 3, true),
    ('도심 권역', 'Historical CBD', '역사와 현대가 공존하는 핵심 비즈니스 지구, 서울의 중심에서 누리는 희소 가치', 'assets/dosim.png', '도심', 4, true),
    ('미아 권역', 'New Residential', '동북권 주거 지도의 대대적 개편, 신규 뉴타운 조성으로 가치가 급상승 중인 유망지', 'assets/mia.png', '미아', 5, true),
    ('청량리 권역', 'Transit Hub', 'GTX 등 압도적 교통망 확충과 초고층 랜드마크 숲으로 변모하는 동북권 최대 관문', 'assets/cheongnyangni.png', '청량리', 6, true),
    ('구의 권역', 'Riverside Mixed-use', '첨단지식산업센터와 한강 변 주거가 어우러지는 복합 개발의 중심지', 'assets/gui.png', '구의', 7, true)
) AS v(name, tag, description, image_url, region_key, sort_order, is_active)
WHERE NOT EXISTS (SELECT 1 FROM regions LIMIT 1);
`;

async function sync() {
    const client = createClient();
    try {
        await client.connect();
        console.log('Connected to database');
        await client.query(sql);
        console.log('Schema synchronization successful');
        
        await client.query(seedRegions);
        console.log('Seed data inserted (if table was empty)');
        
        const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log('Current tables:', res.rows.map(r => r.table_name).join(', '));
        
    } catch (err) {
        console.error('Error synchronizing schema:', err);
    } finally {
        await client.end();
    }
}

sync();
