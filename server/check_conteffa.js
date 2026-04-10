const Database = require('better-sqlite3');
try {
  const db = new Database('../conteffa-connect/server/database.sqlite');
  console.log("CONTEFFA_CONNECT USERS:", db.prepare('SELECT count(*) as c FROM users').get().c);
  db.close();
} catch (e) {
  console.error(e);
}
