const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new Database(dbPath);

try {
    db.exec(`DROP TABLE IF EXISTS tasks`);
    db.exec(`
        CREATE TABLE tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            title TEXT NOT NULL,
            description TEXT,
            priority TEXT DEFAULT 'medium',
            status TEXT DEFAULT 'pending',
            deadline DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);
    console.log("Tasks table dropped and recreated with correct columns: description, deadline, etc.");
} catch (error) {
    console.error("Error recreating tasks table:", error);
}
