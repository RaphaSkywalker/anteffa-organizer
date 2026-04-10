const Database = require('better-sqlite3');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const db = new Database('database.sqlite');

async function test() {
   let ts = 0; try{ts = db.prepare('SELECT count(*) as c from teams').get().c;}catch(e){}
   let tk = 0; try{tk = db.prepare('SELECT count(*) as c from tasks').get().c;}catch(e){}
   
   let { count: ts_sb } = await supabase.from('teams').select('*', { count: 'exact', head: true });
   let { count: tk_sb } = await supabase.from('tasks').select('*', { count: 'exact', head: true });

   console.log('teams SQLite:', ts, 'Supabase:', ts_sb);
   console.log('tasks SQLite:', tk, 'Supabase:', tk_sb);
}
test();
