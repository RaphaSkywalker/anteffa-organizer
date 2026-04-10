const Database = require('better-sqlite3');
try {
  const db = new Database('database.sqlite');
  const rows = db.prepare('SELECT * FROM users').all();
  console.log("USERS IN SQLITE:", rows.length);
  db.close();
} catch (e) {
  console.error("SQLITE ERROR:", e.message);
}
