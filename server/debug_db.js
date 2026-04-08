const db = require('./db.js');

async function test() {
  try {
    const { data, error } = await db.from('time_logs').select('*').limit(5);
    if (error) {
      console.error('Error fetching logs:', error);
    } else {
      console.log('Last logs:', JSON.stringify(data, null, 2));
    }
  } catch (e) {
    console.error('Fatal error:', e);
  }
}

test();
