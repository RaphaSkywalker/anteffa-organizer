const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new Database(dbPath);

try {
    // Add new columns to agenda table
    db.exec(`
        ALTER TABLE agenda ADD COLUMN event_type TEXT DEFAULT 'lembrete';
        ALTER TABLE agenda ADD COLUMN event_time TEXT;
        ALTER TABLE agenda ADD COLUMN recurrence TEXT DEFAULT 'none';
        ALTER TABLE agenda ADD COLUMN reminder_days INTEGER DEFAULT 3;
    `);
    console.log("Agenda table updated with new columns.");
} catch (e) {
    console.log("Some columns might already exist in agenda table.");
}

db.close();
