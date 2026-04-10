const db = require('./db.js');
async function f() {
    let { data } = await db.from('users').select('*');
    console.log("USERS IN SUPABASE:", data?.length);
}
f();
