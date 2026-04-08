const db = require('./db.js');

async function listTables() {
  try {
    const { data, error } = await db.rpc('get_tables'); // This might not work if RPC is not defined
    if (error) {
      console.log('RPC failed, trying generic select...');
      const { data: teams, error: e2 } = await db.from('teams').select('*').limit(1);
      console.log('Teams table exists:', !!teams);
    } else {
      console.log('Tables:', data);
    }
  } catch (e) {
    console.error(e);
  }
}

listTables();
