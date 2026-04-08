const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new Database(dbPath);

try {
    // Add team_id column to users if it doesn't exist
    db.exec("ALTER TABLE users ADD COLUMN team_id INTEGER REFERENCES teams(id)");
    console.log("Column team_id added to users table.");
} catch (e) {
    if (e.message.includes('duplicate column name')) {
        console.log("Column team_id already exists.");
    } else {
        console.error("Error adding column:", e.message);
    }
}

try {
    // Ensure teams table exists (it might already from previous db.js run)
    db.exec(`
      CREATE TABLE IF NOT EXISTS teams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        color TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Teams table verified.");
} catch (e) {
    console.error("Error creating teams table:", e.message);
}

db.close();
