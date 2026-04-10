const Database = require('better-sqlite3');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const dbPath = 'database.sqlite';
const db = new Database(dbPath);

async function compare() {
    const tables = ['users', 'absences', 'medical_certificates', 'time_logs', 'birthdays', 'company_dates'];
    for (const table of tables) {
        let sqliteCount = 0;
        try {
           sqliteCount = db.prepare(`SELECT count(*) as count FROM ${table}`).get().count;
        } catch(e) {}
        
        let sbCount = 0;
        try {
           const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
           sbCount = count || 0;
        } catch(e) {}

        console.log(`${table.padEnd(20)} | SQLite: ${sqliteCount} | Supabase: ${sbCount}`);
    }
    db.close();
}

compare();
