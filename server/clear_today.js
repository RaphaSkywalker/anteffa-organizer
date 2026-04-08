const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function clear() {
    const today = '2026-04-07'; // User's today (local)
    console.log(`Limpando registros para ${today}...`);
    
    const { data, error } = await supabase
        .from('time_logs')
        .delete()
        .eq('punch_date', today);
        
    if (error) console.error('Erro ao deletar:', error);
    else console.log('Registros de hoje limpos com sucesso!');
}

clear();
