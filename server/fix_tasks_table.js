const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new Database(dbPath);

try {
    // Attempt to add description column if it doesn't exist
    db.exec(`ALTER TABLE tasks ADD COLUMN description TEXT`);
    console.log("Column 'description' added to tasks table.");
} catch (error) {
    if (error.message.includes("duplicate column name")) {
        console.log("Column 'description' already exists.");
    } else {
        console.error("Error updating tasks table:", error);
    }
}
