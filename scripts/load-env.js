const fs = require('fs');
const path = require('path');

function stripWrappingQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function loadEnvFile(projectRoot) {
  const envPath = path.join(projectRoot, '.env');

  if (!fs.existsSync(envPath)) {
    return;
  }

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();

    if (!key || process.env[key] !== undefined) {
      continue;
    }

    process.env[key] = stripWrappingQuotes(rawValue);
  }
}

/**
 * Creates a pg Client with proper SSL config (suppresses pg v8 deprecation warning).
 * Requires NETLIFY_DATABASE_URL to be set in process.env.
 */
function createClient() {
  const { Client } = require('pg');
  const connectionString = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('NETLIFY_DATABASE_URL is not set in .env');
  }

  return new Client({
    connectionString
  });
}

module.exports = { loadEnvFile, createClient };

