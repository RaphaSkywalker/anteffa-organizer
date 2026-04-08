const { createClient } = require('@supabase/supabase-js');
const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new Database(dbPath);

async function migrate() {
    console.log('🚀 Iniciando migração para o Supabase...');

    try {
        // 1. Equipes (Teams)
        const teams = db.prepare('SELECT * FROM teams').all();
        if (teams.length > 0) {
            console.log(`Migrando ${teams.length} equipes...`);
            const { error: tError } = await supabase.from('teams').insert(teams);
            if (tError) throw tError;
        }

        // 2. Usuários (Users)
        const users = db.prepare('SELECT * FROM users').all();
        if (users.length > 0) {
            console.log(`Migrando ${users.length} usuários...`);
            const { error: uError } = await supabase.from('users').insert(users);
            if (uError) throw uError;
        }

        // 3. Agenda
        const agenda = db.prepare('SELECT * FROM agenda').all();
        if (agenda.length > 0) {
            console.log(`Migrando ${agenda.length} registros de agenda...`);
            const { error: aError } = await supabase.from('agenda').insert(agenda);
            if (aError) throw aError;
        }

        // 4. Tarefas (Tasks)
        const tasks = db.prepare('SELECT * FROM tasks').all();
        if (tasks.length > 0) {
            console.log(`Migrando ${tasks.length} tarefas...`);
            const { error: tkError } = await supabase.from('tasks').insert(tasks);
            if (tkError) throw tkError;
        }

        // 5. Mensagens (Messages)
        const messages = db.prepare('SELECT * FROM messages').all();
        if (messages.length > 0) {
            console.log(`Migrando ${messages.length} mensagens...`);
            const { error: mError } = await supabase.from('messages').insert(messages);
            if (mError) throw mError;
        }

        // 6. Mail
        const mail = db.prepare('SELECT * FROM mail').all();
        if (mail.length > 0) {
            console.log(`Migrando ${mail.length} e-mails...`);
            const { error: mlError } = await supabase.from('mail').insert(mail);
            if (mlError) throw mlError;
        }

        // 7. Aniversários (Birthdays)
        const birthdays = db.prepare('SELECT * FROM birthdays').all();
        if (birthdays.length > 0) {
            console.log(`Migrando ${birthdays.length} aniversariantes...`);
            const { error: bError } = await supabase.from('birthdays').insert(birthdays);
            if (bError) throw bError;
        }

        // 8. Datas Comemorativas (Company Dates)
        const companyDates = db.prepare('SELECT * FROM company_dates').all();
        if (companyDates.length > 0) {
            console.log(`Migrando ${companyDates.length} datas comemorativas...`);
            const { error: cdError } = await supabase.from('company_dates').insert(companyDates);
            if (cdError) throw cdError;
        }

        console.log('✅ Migração concluída com sucesso!');
    } catch (err) {
        console.error('❌ Erro na migração:', err.message);
    } finally {
        db.close();
    }
}

migrate();
