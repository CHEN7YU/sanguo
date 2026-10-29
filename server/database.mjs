import { DatabaseSync, backup } from 'node:sqlite';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, existsSync, chmodSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const migrations = fileURLToPath(new URL('../migrations/', import.meta.url));

function migrationSources() {
  return readdirSync(migrations).filter(name => /^\d{4}_[a-z0-9_]+\.sql$/.test(name)).sort().map(name => {
    const sql = readFileSync(resolve(migrations, name), 'utf8');
    return { name, sql, checksum: createHash('sha256').update(sql).digest('hex') };
  });
}

export function verifyMigrations(sqlite) {
  for (const { name, checksum } of migrationSources()) {
    const applied = sqlite.prepare('SELECT checksum FROM app_migrations WHERE name = ?').get(name);
    if (!applied || applied.checksum !== checksum) throw new Error(`Pending or changed migration: ${name}`);
  }
}

export function openDatabase(filename, { readOnly = false } = {}) {
  if (!isAbsolute(filename)) throw new Error('Database path must be absolute');
  if (!existsSync(dirname(filename))) throw new Error('Create the persistent database directory first');
  const sqlite = new DatabaseSync(filename, { readOnly });
  try {
    sqlite.exec('PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
    if (!readOnly) {
      chmodSync(filename, 0o600);
      sqlite.exec('PRAGMA journal_mode = WAL; PRAGMA synchronous = FULL;');
    }
    return sqlite;
  } catch (error) {
    sqlite.close();
    throw error;
  }
}

export function migrateDatabase(sqlite) {
  sqlite.exec(`CREATE TABLE IF NOT EXISTS app_migrations (
    name TEXT PRIMARY KEY NOT NULL, checksum TEXT NOT NULL, applied_at INTEGER NOT NULL
  )`);
  for (const { name, sql, checksum } of migrationSources()) {
    const applied = sqlite.prepare('SELECT checksum FROM app_migrations WHERE name = ?').get(name);
    if (applied) {
      if (applied.checksum !== checksum) throw new Error(`Applied migration changed: ${name}`);
      continue;
    }
    sqlite.exec('BEGIN IMMEDIATE');
    try {
      sqlite.exec(sql);
      sqlite.prepare('INSERT INTO app_migrations VALUES (?, ?, ?)').run(name, checksum, Date.now());
      sqlite.exec('COMMIT');
    } catch (error) {
      sqlite.exec('ROLLBACK');
      throw new Error(`Migration failed: ${name}`, { cause: error });
    }
  }
}

// Keep the shared API handlers on the same SQL and atomic batch semantics as D1.
export function databaseBinding(sqlite) {
  function statement(sql, values = []) {
    return {
      bind: (...parameters) => statement(sql, parameters),
      first: async () => sqlite.prepare(sql).get(...values) || null,
      all: async () => ({ results: sqlite.prepare(sql).all(...values) }),
      run: async () => sqlite.prepare(sql).run(...values),
      execute: () => sqlite.prepare(sql).all(...values)
    };
  }
  return {
    prepare: sql => statement(sql),
    async batch(statements) {
      sqlite.exec('BEGIN IMMEDIATE');
      try {
        const results = statements.map(item => ({ results: item.execute(), success: true }));
        sqlite.exec('COMMIT');
        return results;
      } catch (error) {
        sqlite.exec('ROLLBACK');
        throw error;
      }
    }
  };
}

export async function backupDatabase(source, destination) {
  if (typeof destination !== 'string' || !isAbsolute(destination) || resolve(source) === resolve(destination)) {
    throw new Error('Backup requires a separate absolute destination');
  }
  // Refuse to overwrite any existing recovery copy.
  const { open } = await import('node:fs/promises');
  const sqlite = openDatabase(source, { readOnly: true });
  try {
    const reserved = await open(destination, 'wx', 0o600);
    await reserved.close();
    await backup(sqlite, destination);
    const copy = openDatabase(destination, { readOnly: true });
    try {
      if (copy.prepare('PRAGMA integrity_check').get().integrity_check !== 'ok'
          || copy.prepare('PRAGMA foreign_key_check').all().length) {
        throw new Error('Backup verification failed; do not use this copy for recovery');
      }
    } finally { copy.close(); }
  } finally { sqlite.close(); }
}
