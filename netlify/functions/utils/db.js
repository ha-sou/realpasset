const { Client } = require('pg');

/**
 * Creates a new PostgreSQL client using environment variables.
 * No hardcoded credentials — relies on DATABASE_URL env var.
 * SSL is explicitly configured to suppress pg v8 deprecation warnings.
 */
function createDbClient() {
  const connectionString = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('NETLIFY_DATABASE_URL environment variable is not set');
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
