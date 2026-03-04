import type Database from 'better-sqlite3';

export function initializeSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS managers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS agents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      manager_id INTEGER NOT NULL REFERENCES managers(id) ON DELETE CASCADE,
      avatar_seed TEXT NOT NULL,
      UNIQUE(full_name, manager_id)
    );
  `);
}
