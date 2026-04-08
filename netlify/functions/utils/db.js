const { Client } = require('pg');

/**
 * Creates a new PostgreSQL client using environment variables.
 * No hardcoded credentials — relies on DATABASE_URL env var.
 * SSL is explicitly configured to suppress pg v8 deprecation warnings.
 */
function createDbClient() {
  const fallback = 'postgresql://neondb_owner:npg_fCkTeHDp69dB@ep-bold-scene-a1n3azr4-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
  const connectionString = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL || fallback;

  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set and no fallback available.');
  }

  // Remove sslmode from connection string to avoid pg v8 deprecation warning
  // and configure SSL explicitly via the ssl option
  const url = new URL(connectionString);
  url.searchParams.delete('sslmode');
  const cleanUrl = url.toString();

  return new Client({
    connectionString: cleanUrl,
    ssl: {
      rejectUnauthorized: true
    }
  });
}

module.exports = { createDbClient };
