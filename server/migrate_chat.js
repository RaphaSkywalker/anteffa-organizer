const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new Database(dbPath);

console.log('Migrating chat table...');

try {
    db.exec('DROP TABLE IF EXISTS messages');
    db.exec(`
    CREATE TABLE messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER,
      target_type TEXT NOT NULL, -- 'global', 'team', 'direct'
      target_id INTEGER, -- team_id, user_id, or NULL for global
      content TEXT NOT NULL,
      is_deleted INTEGER DEFAULT 0,
      is_edited INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sender_id) REFERENCES users(id)
    );
  `);
    console.log('Chat table migrated successfully!');
} catch (e) {
    console.error('Migration failed:', e);
} finally {
    db.close();
}
