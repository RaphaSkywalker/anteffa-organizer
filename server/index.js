const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = 3001;
const JWT_SECRET = 'anteffa_secret_key_2026';

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request Logger
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Multer Storage for Avatars
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'uploads/avatars/'));
    },
    filename: (req, file, cb) => {
        const userId = req.user?.id || 'temp';
        cb(null, `avatar-${userId}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 } // 2MB
});

// Multer Storage for Documents
const docStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'uploads/documents/'));
    },
    filename: (req, file, cb) => {
        const userId = req.user?.id || 'temp';
        cb(null, `doc-${userId}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const uploadDocument = multer({
    storage: docStorage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});


// Middleware for Auth
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Token não fornecido' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Token inválido' });
        req.user = user;
        next();
    });
};

// --- AUTH ROUTES ---

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    const { data: user, error } = await db
        .from('users')
        .select('*, teams(name)')
        .eq('username', username)
        .single();

    if (error || !user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ error: 'Usuário ou senha inválidos' });
    }

    const team_name = user.teams ? user.teams.name : null;

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

    res.json({
        token,
        user: {
            id: user.id,
            username: user.username,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar_url: user.avatar_url,
            team_id: user.team_id,
            team_name: team_name
        }
    });
});

// --- PROFILE ROUTES ---

app.get('/api/profile', authenticateToken, async (req, res) => {
    const { data: user, error } = await db
        .from('users')
        .select('id, username, name, email, role, avatar_url, team_id, teams(name)')
        .eq('id', req.user.id)
        .single();
    
    if (user && user.teams) {
        user.team_name = user.teams.name;
        delete user.teams;
    }
    res.json(user);
});

app.put('/api/profile', authenticateToken, async (req, res) => {
    const { name, email } = req.body;
    await db.from('users').update({ name, email }).eq('id', req.user.id);
    res.json({ message: 'Perfil atualizado' });
});

app.post('/api/upload-avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    await db.from('users').update({ avatar_url: avatarUrl }).eq('id', req.user.id);

    res.json({ avatar_url: avatarUrl });
});

app.post('/api/upload-document', authenticateToken, uploadDocument.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    const fileUrl = `/uploads/documents/${req.file.filename}`;
    res.json({ url: fileUrl });
});

app.post('/api/change-password', authenticateToken, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const { data: user } = await db.from('users').select('password').eq('id', req.user.id).single();

    if (!user || !bcrypt.compareSync(currentPassword, user.password)) {
        return res.status(400).json({ error: 'Senha atual incorreta' });
    }

    const hashedNewPassword = bcrypt.hashSync(newPassword, 10);
    await db.from('users').update({ password: hashedNewPassword }).eq('id', req.user.id);

    res.json({ message: 'Senha alterada com sucesso' });
});

// --- ADMIN ROUTES ---

app.get('/api/admin/employees', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acesso negado' });

    const { data: employees } = await db
        .from('users')
        .select('id, username, name, email, role, avatar_url, created_at, team_id, teams(name)')
        .order('created_at', { ascending: false });

    const formatted = employees.map(u => ({
        ...u,
        team_name: u.teams ? u.teams.name : null
    }));
    
    res.json(formatted);
});

// --- BULLETINS (MURAL) ROUTES ---

app.get('/api/bulletins', authenticateToken, async (req, res) => {
    try {
        const { data: bulletins, error } = await db
            .from('bulletins')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(bulletins);
    } catch (e) {
        console.error('[BULLETINS_ERROR]', e);
        res.status(500).json({ error: 'Erro ao listar avisos' });
    }
});

app.post('/api/admin/bulletins', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acesso negado' });
    try {
        const { title, content, category } = req.body;
        const { data, error } = await db.from('bulletins').insert({ title, content, category });
        if (error) throw error;
        res.json({ message: 'Aviso criado com sucesso', data });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.put('/api/admin/bulletins/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acesso negado' });
    try {
        const { title, content, category } = req.body;
        const { error } = await db.from('bulletins').update({ title, content, category }).eq('id', req.params.id);
        if (error) throw error;
        res.json({ message: 'Aviso atualizado com sucesso' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/admin/bulletins/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acesso negado' });
    try {
        const { error } = await db.from('bulletins').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ message: 'Aviso removido' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/admin/employees/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acesso negado' });
    const { data: employee } = await db
        .from('users')
        .select('*, teams(name)')
        .eq('id', req.params.id)
        .single();

    if (employee && employee.teams) {
        employee.team_name = employee.teams.name;
    }
    res.json(employee);
});

// New route for chat contacts list (accessible to everyone)
app.get('/api/employees', authenticateToken, async (req, res) => {
    try {
        const { data: users, error: uError } = await db
            .from('users')
            .select('id, username, name, email, role, avatar_url, team_id, teams(name)')
            .order('name');

        if (uError) throw uError;

        const { data: unread, error: mError } = await db
            .from('messages')
            .select('sender_id')
            .eq('target_id', req.user.id)
            .eq('target_type', 'direct')
            .eq('is_read', 0);

        if (mError) throw mError;

        const formatted = users.map(u => {
            const unreadCount = unread.filter(m => m.sender_id === u.id).length;
            return {
                ...u,
                team_name: u.teams ? u.teams.name : null,
                unread_count: unreadCount
            };
        });

        console.log(`[CHAT_DEBUG] Returning ${formatted.length} users to ${req.user.username} with unread counts`);
        res.json(formatted);
    } catch (e) {
        console.error('[CHAT_ERROR]', e);
        res.status(500).json({ error: 'Erro ao listar funcionários' });
    }
});

// --- TEAMS ---
app.get('/api/teams', authenticateToken, async (req, res) => {
    const { data: list } = await db.from('teams').select('*').order('name');
    res.json(list || []);
});

app.post('/api/admin/teams', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acesso negado' });
    const { name, description, color } = req.body;
    try {
        const { error } = await db.from('teams').insert({ name, description, color });
        if (error) throw error;
        res.json({ message: 'Equipe criada com sucesso' });
    } catch (e) {
        res.status(400).json({ error: 'Equipe já existe' });
    }
});

app.put('/api/admin/teams/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acesso negado' });
    const { name, description, color } = req.body;
    try {
        const { error } = await db.from('teams').update({ name, description, color }).eq('id', req.params.id);
        if (error) throw error;
        res.json({ message: 'Equipe atualizada com sucesso' });
    } catch (e) {
        res.status(400).json({ error: 'Erro ao atualizar equipe' });
    }
});

app.delete('/api/admin/teams/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acesso negado' });
    await db.from('teams').delete().eq('id', req.params.id);
    res.json({ message: 'Equipe excluída' });
});

app.delete('/api/admin/employees/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acesso negado' });
    if (parseInt(req.params.id) === req.user.id) {
        return res.status(400).json({ error: 'Você não pode excluir seu próprio usuário' });
    }
    await db.from('users').delete().eq('id', req.params.id);
    res.json({ message: 'Funcionário excluído' });
});

// Update create-employee to include team_id
app.post('/api/admin/create-employee', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acesso negado' });

    const { username, password, name, email, team_id } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);

    try {
        const { error } = await db.from('users').insert({ 
            username, 
            password: hashedPassword, 
            name, 
            email, 
            role: 'employee', 
            team_id: team_id || null 
        });
        if (error) throw error;
        res.json({ message: 'Funcionário cadastrado com sucesso' });
    } catch (error) {
        res.status(400).json({ error: 'Usuário já existe' });
    }
});

app.put('/api/admin/employees/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acesso negado' });
    const { name, email, team_id, username } = req.body;
    try {
        const { error } = await db.from('users').update({ 
            name, 
            email, 
            team_id: team_id || null, 
            username 
        }).eq('id', req.params.id);
        if (error) throw error;
        res.json({ message: 'Funcionário atualizado com sucesso' });
    } catch (e) {
        res.status(400).json({ error: 'Erro ao atualizar funcionário' });
    }
});

// --- BIRTHDAYS ---
app.get('/api/birthdays', authenticateToken, async (req, res) => {
    const { data: birthdays } = await db
        .from('birthdays')
        .select('*')
        .order('birth_date');

    const { data: users } = await db.from('users').select('name, avatar_url');
    
    // Injetar o avatar dinamicamente se o nome do usuário cadastrado no aniversário 
    // corresponder a um usuário real no sistema com foto.
    const enrichedBirthdays = (birthdays || []).map(b => {
        const matchingUser = users?.find(u => u.name && u.name.trim().toLowerCase() === b.name.trim().toLowerCase());
        return {
            ...b,
            avatar_url: matchingUser?.avatar_url || null
        };
    });
    
    res.json(enrichedBirthdays);
});

app.post('/api/admin/birthdays', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acesso negado' });
    const { name, birth_date, department } = req.body;
    await db.from('birthdays').insert({ name, birth_date, department });
    res.json({ message: 'Aniversariante cadastrado' });
});

app.put('/api/admin/birthdays/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acesso negado' });
    const { name, birth_date, department } = req.body;
    await db.from('birthdays').update({ name, birth_date, department }).eq('id', req.params.id);
    res.json({ message: 'Aniversariante atualizado' });
});

app.delete('/api/admin/birthdays/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acesso negado' });
    await db.from('birthdays').delete().eq('id', req.params.id);
    res.json({ message: 'Excluído' });
});

// --- COMPANY DATES ---
app.get('/api/company-dates', authenticateToken, async (req, res) => {
    const { data: list } = await db.from('company_dates').select('*').order('event_date');
    res.json(list || []);
});

app.post('/api/admin/company-dates', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acesso negado' });
    const { title, event_date, description, is_recurring, date_type } = req.body;
    await db.from('company_dates').insert({ title, event_date, description, is_recurring: is_recurring || false, date_type: date_type || 'comemorativa' });
    res.json({ message: 'Data comemorativa cadastrada' });
});

app.put('/api/admin/company-dates/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acesso negado' });
    const { title, event_date, description, is_recurring, date_type } = req.body;
    await db.from('company_dates').update({ title, event_date, description, is_recurring, date_type }).eq('id', req.params.id);
    res.json({ message: 'Data comemorativa atualizada' });
});

app.delete('/api/admin/company-dates/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acesso negado' });
    await db.from('company_dates').delete().eq('id', req.params.id);
    res.json({ message: 'Excluído' });
});

// --- MANAGEMENT & HR ROUTES ---

app.get('/api/admin/management/stats', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acesso negado' });
    
    const { month, year } = req.query;
    try {
        const start = `${year}-${month}-01`;
        const end = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[1] === 'T' ? `${year}-${month}-31` : new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];

        // 1. Total Absences this month
        const { data: absences } = await db.from('absences')
            .select('*')
            .gte('absence_date', start)
            .lte('absence_date', end);

        // 2. Total Medical Certificates this month
        const { data: certs } = await db.from('medical_certificates')
            .select('*')
            .or(`and(start_date.gte.${start},start_date.lte.${end}),and(end_date.gte.${start},end_date.lte.${end})`);

        // 3. Time Log Aggregates for all employees
        const { data: logs } = await db.from('time_logs')
            .select('*')
            .gte('punch_date', start)
            .lte('punch_date', end);

        // Simple hour calculation logic (shared concept with Ponto stats)
        const dailyData = {};
        logs.forEach(log => {
            const key = `${log.user_id}-${log.punch_date}`;
            if (!dailyData[key]) dailyData[key] = [];
            dailyData[key].push(log);
        });

        let totalPositive = 0;
        let totalNegative = 0;
        const PREVISTO_DIARIO = 8; // Assuming 8h days

        Object.values(dailyData).forEach((dayLogs) => {
            let totalMinutes = 0;
            const timeToMinutes = (t) => {
                const [h, m] = t.split(':').map(Number);
                return h * 60 + m;
            };

            const findLog = (type) => dayLogs.find((l) => l.punch_type === type);
            const ent = findLog('entrada');
            const almS = findLog('almoco_saida');
            const almR = findLog('almoco_retorno');
            const sai = findLog('saida');

            if (ent && sai) {
                if (almS && almR) {
                    totalMinutes = (timeToMinutes(almS.punch_time) - timeToMinutes(ent.punch_time)) + 
                                   (timeToMinutes(sai.punch_time) - timeToMinutes(almR.punch_time));
                } else {
                    totalMinutes = (timeToMinutes(sai.punch_time) - timeToMinutes(ent.punch_time));
                }
            }

            const hours = totalMinutes / 60;
            const diff = hours - PREVISTO_DIARIO;
            if (diff > 0) totalPositive += diff;
            else if (diff < 0) totalNegative += Math.abs(diff);
        });

        res.json({
            total_absences: absences?.length || 0,
            total_certificates: certs?.length || 0,
            total_positive_hours: parseFloat(totalPositive.toFixed(1)),
            total_negative_hours: parseFloat(totalNegative.toFixed(1))
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Absences CRUD (Admin & Pessoal)
app.get('/api/absences/my', authenticateToken, async (req, res) => {
    const { data } = await db.from('absences').select('*').eq('user_id', req.user.id).order('absence_date', { ascending: false });
    res.json(data || []);
});

app.post('/api/absences', authenticateToken, async (req, res) => {
    const { absence_date, end_date, reason, category, attachment_url, metadata } = req.body;
    await db.from('absences').insert({
        user_id: req.user.id,
        absence_date,
        end_date,
        reason,
        category,
        attachment_url,
        metadata: metadata || null,
        status: 'Pendente'
    });
    res.json({ message: 'Justificativa enviada com sucesso!' });
});

app.delete('/api/absences/:id', authenticateToken, async (req, res) => {
    try {
        const { data: absence } = await db.from('absences').select('status, user_id').eq('id', req.params.id).single();
        if (!absence) return res.status(404).json({ error: 'Registro não encontrado' });
        if (absence.user_id !== req.user.id) return res.status(403).json({ error: 'Acesso negado' });
        if (absence.status !== 'Negado') return res.status(400).json({ error: 'Apenas registros negados podem ser excluídos' });

        await db.from('absences').delete().eq('id', req.params.id);
        res.json({ message: 'Registro excluído com sucesso!' });
    } catch (e) {
        res.status(500).json({ error: 'Erro ao excluir registro' });
    }
});

app.get('/api/admin/absences', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acesso negado' });
    const { data } = await db.from('absences').select('*, users(name)').order('absence_date', { ascending: false });
    res.json(data || []);
});

app.post('/api/admin/absences', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acesso negado' });
    const { user_id, absence_date, end_date, reason, category, attachment_url, metadata, status } = req.body;
    await db.from('absences').insert({ user_id, absence_date, end_date, reason, category, attachment_url, metadata: metadata || null, status: status || 'Pendente' });
    res.json({ message: 'Falta registrada' });
});

app.put('/api/admin/absences/:id/status', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin' && req.user.team_name !== 'Financeiro' && req.user.team_name !== 'Presidência') return res.status(403).json({ error: 'Acesso negado' });
    const { status } = req.body;
    await db.from('absences').update({ status }).eq('id', req.params.id);
    res.json({ message: 'Status atualizado com sucesso' });
});

// Certificates CRUD
app.get('/api/admin/medical-certificates', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acesso negado' });
    const { data } = await db.from('medical_certificates').select('*, users(name)').order('start_date', { ascending: false });
    res.json(data || []);
});

app.post('/api/admin/medical-certificates', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acesso negado' });
    const { user_id, start_date, end_date, description } = req.body;
    await db.from('medical_certificates').insert({ user_id, start_date, end_date, description });
    res.json({ message: 'Atestado registrado' });
});

// --- AGENDA ---
app.get('/api/agenda', authenticateToken, async (req, res) => {
    const { data: list } = await db
        .from('agenda')
        .select('*')
        .eq('user_id', req.user.id)
        .order('start_date');
    res.json(list || []);
});

app.post('/api/agenda', authenticateToken, async (req, res) => {
    const { title, description, start_date, event_time, event_type, recurrence, reminder_days, color } = req.body;
    try {
        await db.from('agenda').insert({
            user_id: req.user.id,
            title,
            description,
            start_date,
            event_time,
            event_type,
            recurrence,
            reminder_days,
            color
        });
        res.json({ message: 'Evento criado com sucesso' });
    } catch (e) {
        res.status(400).json({ error: 'Erro ao criar evento: ' + e.message });
    }
});

app.delete('/api/agenda/:id', authenticateToken, async (req, res) => {
    await db.from('agenda').delete().eq('id', req.params.id).eq('user_id', req.user.id);
    res.json({ message: 'Evento excluído' });
});

// --- TASKS ---
app.get('/api/tasks', authenticateToken, async (req, res) => {
    const { data: list } = await db
        .from('tasks')
        .select('*')
        .eq('user_id', req.user.id)
        .order('deadline');
    res.json(list || []);
});

app.post('/api/tasks', authenticateToken, async (req, res) => {
    const { title, description, priority, status, deadline } = req.body;
    try {
        await db.from('tasks').insert({
            user_id: req.user.id,
            title,
            description,
            priority: priority || 'medium',
            status: status || 'pending',
            deadline
        });
        res.json({ message: 'Tarefa criada com sucesso' });
    } catch (e) {
        res.status(400).json({ error: 'Erro ao criar tarefa: ' + e.message });
    }
});

app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
    const { title, description, priority, status, deadline } = req.body;
    try {
        await db.from('tasks').update({
            title,
            description,
            priority,
            status,
            deadline
        }).eq('id', req.params.id).eq('user_id', req.user.id);
        res.json({ message: 'Tarefa atualizada com sucesso' });
    } catch (e) {
        res.status(400).json({ error: 'Erro ao atualizar tarefa: ' + e.message });
    }
});

app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
    await db.from('tasks').delete().eq('id', req.params.id).eq('user_id', req.user.id);
    res.json({ message: 'Tarefa excluída' });
});

// --- TIME LOGS / PONTO ---

app.get(['/api/time-logs', '/api/time-log'], authenticateToken, async (req, res) => {
    try {
        const { date, userId } = req.query; // optional specific date/user
        const targetUserId = (req.user.role === 'admin' && userId) ? userId : req.user.id;
        let query = db.from('time_logs').select('*').eq('user_id', targetUserId);
        
        if (date) {
            query = query.eq('punch_date', date);
        }

        const { data: logs, error } = await query.order('punch_time', { ascending: true });
        if (error) throw error;
        res.json(logs || []);
    } catch (e) {
        res.status(500).json({ error: 'Erro ao buscar registros de ponto' });
    }
});

app.post(['/api/time-logs', '/api/time-log'], authenticateToken, async (req, res) => {
    const { punch_type, punch_time, punch_date, latitude, longitude, location_category } = req.body;
    try {
        // Check if day is already finalized
        const { data: existing } = await db.from('time_logs')
            .select('is_finalized')
            .eq('user_id', req.user.id)
            .eq('punch_date', punch_date)
            .eq('is_finalized', 1)
            .limit(1);

        if (existing && existing.length > 0) {
            return res.status(403).json({ error: 'Este dia já foi finalizado e não permite novos registros.' });
        }

        await db.from('time_logs').insert({
            user_id: req.user.id,
            punch_type,
            punch_time,
            punch_date,
            latitude,
            longitude,
            location_category,
            is_finalized: 0
        });
        res.json({ message: 'Ponto registrado com sucesso!' });
    } catch (e) {
        res.status(400).json({ error: 'Erro ao registrar ponto: ' + e.message });
    }
});

app.put(['/api/time-logs/:id', '/api/time-log/:id'], authenticateToken, async (req, res) => {
    const { punch_time, punch_type } = req.body;
    try {
        const { data: log } = await db.from('time_logs').select('*').eq('id', req.params.id).single();
        if (!log || log.user_id !== req.user.id) return res.status(403).json({ error: 'Acesso negado' });
        
        if (log.is_finalized) return res.status(403).json({ error: 'Registros finalizados não podem ser editados.' });

        await db.from('time_logs').update({ punch_time, punch_type }).eq('id', req.params.id);
        res.json({ message: 'Registro atualizado.' });
    } catch (e) {
        res.status(400).json({ error: 'Erro ao atualizar ponto' });
    }
});

app.delete(['/api/time-logs/:id', '/api/time-log/:id'], authenticateToken, async (req, res) => {
    try {
        const { data: log } = await db.from('time_logs').select('*').eq('id', req.params.id).single();
        if (!log || log.user_id !== req.user.id) return res.status(403).json({ error: 'Acesso negado' });
        
        if (log.is_finalized) return res.status(403).json({ error: 'Registros finalizados não podem ser excluídos.' });

        await db.from('time_logs').delete().eq('id', req.params.id);
        res.json({ message: 'Registro excluído com sucesso.' });
    } catch (e) {
        res.status(400).json({ error: 'Erro ao excluir ponto' });
    }
});

app.post(['/api/time-logs/finalize', '/api/time-log/finalize'], authenticateToken, async (req, res) => {
    const { date } = req.body;
    try {
        await db.from('time_logs').update({ is_finalized: 1 }).eq('user_id', req.user.id).eq('punch_date', date);
        res.json({ message: 'Jornada finalizada com sucesso!' });
    } catch (e) {
        res.status(400).json({ error: 'Erro ao finalizar jornada' });
    }
});

app.get(['/api/time-logs/stats', '/api/time-log/stats'], authenticateToken, async (req, res) => {
    const { month, year, userId } = req.query; // format e.g. 04, 2026
    try {
        const targetUserId = (req.user.role === 'admin' && userId) ? userId : req.user.id;
        
        // Correct date range calculation
        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const endDate = new Date(parseInt(year), parseInt(month), 0); // Last day of month
        
        const start = startDate.toISOString().split('T')[0];
        const end = endDate.toISOString().split('T')[0];

        const { data: logs } = await db.from('time_logs')
            .select('*')
            .eq('user_id', targetUserId)
            .gte('punch_date', start)
            .lte('punch_date', end)
            .order('punch_date', { ascending: true })
            .order('punch_time', { ascending: true });

        // Group by date - ensure key is string
        const dailyData = {};
        logs.forEach(log => {
            const d = typeof log.punch_date === 'string' ? log.punch_date : new Date(log.punch_date).toISOString().split('T')[0];
            if (!dailyData[d]) dailyData[d] = [];
            dailyData[d].push(log);
        });

        const stats = Object.keys(dailyData).map(date => {
            const dayLogs = dailyData[date];
            let totalMinutes = 0;
            
            const findLog = (type) => dayLogs.find(l => l.punch_type === type);
            const entrada = findLog('entrada');
            const almocoSaida = findLog('almoco_saida');
            const almocoRetorno = findLog('almoco_retorno');
            const saida = findLog('saida');

            const timeToMinutes = (t) => {
                if (!t) return 0;
                const [h, m] = t.split(':').map(Number);
                return h * 60 + m;
            };

            const nowLocal = new Date();
            const nowStr = nowLocal.toLocaleTimeString('pt-BR', { hour12: false });
            const todayStr = new Intl.DateTimeFormat('fr-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(nowLocal);
            const isToday = date === todayStr;

            if (entrada) {
                // Morning Logic
                if (almocoSaida) {
                    totalMinutes += (timeToMinutes(almocoSaida.punch_time) - timeToMinutes(entrada.punch_time));
                } else if (isToday && !saida) {
                    // Ongoing morning
                    totalMinutes += (timeToMinutes(nowStr) - timeToMinutes(entrada.punch_time));
                }

                // Afternoon Logic
                if (almocoRetorno) {
                    if (saida) {
                        totalMinutes += (timeToMinutes(saida.punch_time) - timeToMinutes(almocoRetorno.punch_time));
                    } else if (isToday) {
                        // Ongoing afternoon
                        totalMinutes += (timeToMinutes(nowStr) - timeToMinutes(almocoRetorno.punch_time));
                    }
                } else if (saida && !almocoSaida) {
                    // Direct shift already handled if both exist
                    totalMinutes = (timeToMinutes(saida.punch_time) - timeToMinutes(entrada.punch_time));
                }
            }

            return {
                date,
                day: parseInt(date.split('-')[2]),
                hours: Math.max(0, parseFloat((totalMinutes / 60).toFixed(2))),
                punches: {
                    entrada: entrada?.punch_time.substring(0, 5) || '--:--',
                    almoco_saida: almocoSaida?.punch_time.substring(0, 5) || '--:--',
                    almoco_retorno: almocoRetorno?.punch_time.substring(0, 5) || '--:--',
                    saida: saida?.punch_time.substring(0, 5) || '--:--'
                }
            };
        });

        res.json(stats);
    } catch (e) {
        res.status(400).json({ error: 'Erro ao buscar estatísticas: ' + e.message });
    }
});

// --- Messages routes ---

// GET unread counts - MUST BE BEFORE /api/messages/:id or other greedy routes
app.get('/api/messages/unread', authenticateToken, async (req, res) => {
    try {
        const { data: unread, error } = await db
            .from('messages')
            .select('sender_id')
            .eq('target_id', req.user.id)
            .eq('target_type', 'direct')
            .eq('is_read', 0);
        
        if (error) throw error;

        // Group by sender_id and count
        const counts = unread.reduce((acc, curr) => {
            const existing = acc.find(item => item.sender_id === curr.sender_id);
            if (existing) {
                existing.count++;
            } else {
                acc.push({ sender_id: curr.sender_id, count: 1 });
            }
            return acc;
        }, []);

        console.log(`[DEBUG] Unread for ${req.user.username} (ID: ${req.user.id}):`, JSON.stringify(counts));
        res.json(counts);
    } catch (e) {
        console.error('[ERROR] Unread:', e);
        res.status(500).json({ error: 'Erro ao buscar counts' });
    }
});

app.get('/api/messages', authenticateToken, async (req, res) => {
    try {
        const { target_type, target_id } = req.query;
        console.log(`[DEBUG] Fetch messages for ${req.user.username}: type=${target_type}, id=${target_id}`);

        let query = db.from('messages').select('*, users(name, avatar_url)').eq('target_type', target_type);

        if (target_type === 'direct') {
            // Complex OR filter: (sender_id = A and target_id = B) OR (sender_id = B and target_id = A)
            query = query.or(`and(sender_id.eq.${req.user.id},target_id.eq.${target_id}),and(sender_id.eq.${target_id},target_id.eq.${req.user.id})`);

            // Mark as read
            await db.from('messages')
                .update({ is_read: 1 })
                .eq('sender_id', target_id)
                .eq('target_id', req.user.id)
                .eq('target_type', 'direct')
                .eq('is_read', 0);
        } else if (target_type === 'team') {
            query = query.eq('target_id', target_id);
        }

        const { data: list, error } = await query.order('created_at', { ascending: true });
        
        if (error) throw error;

        const formatted = list.map(m => ({
            ...m,
            sender_name: m.users ? m.users.name : 'Desconhecido',
            sender_avatar: m.users ? m.users.avatar_url : null
        }));

        console.log(`[DEBUG] Query returned ${formatted.length} messages for ${req.user.username}`);
        res.json(formatted);
    } catch (e) {
        console.error('[ERROR] Fetch messages:', e);
        res.status(500).json({ error: 'Erro ao buscar mensagens: ' + e.message });
    }
});

app.post('/api/messages', authenticateToken, async (req, res) => {
    const { target_type, target_id, content } = req.body;

    try {
        const { data, error } = await db.from('messages').insert({
            sender_id: req.user.id,
            target_type,
            target_id: target_id || null,
            content,
            is_read: 0
        }).select('id').single();

        if (error) throw error;

        res.json({ id: data.id, message: 'Mensagem enviada' });
    } catch (e) {
        console.error('[ERROR] Send message:', e);
        res.status(400).json({ error: 'Erro ao enviar mensagem' });
    }
});

app.put('/api/messages/:id', authenticateToken, async (req, res) => {
    const { content } = req.body;
    const { data: msg } = await db.from('messages').select('sender_id').eq('id', req.params.id).single();

    if (!msg || msg.sender_id !== req.user.id) {
        return res.status(403).json({ error: 'Não permitido' });
    }

    await db.from('messages').update({ content, is_edited: 1 }).eq('id', req.params.id);
    res.json({ message: 'Mensagem editada' });
});

app.delete('/api/messages/clear', authenticateToken, async (req, res) => {
    const { target_type, target_id } = req.query;
    try {
        console.log(`[DEBUG] Clear chat for ${req.user.username}: type=${target_type}, id=${target_id}`);

        let query = db.from('messages').delete().eq('sender_id', req.user.id);

        if (target_type === 'direct') {
            query = query.eq('target_type', 'direct').eq('target_id', target_id);
        } else if (target_type === 'team') {
            query = query.eq('target_type', 'team').eq('target_id', target_id);
        } else if (target_type === 'global') {
            query = query.eq('target_type', 'global');
        }

        const { error } = await query;
        if (error) throw error;

        res.json({ message: 'Seu histórico foi limpo' });
    } catch (e) {
        console.error('[ERROR] Clear chat:', e);
        res.status(500).json({ error: 'Erro ao limpar chat: ' + e.message });
    }
});

app.delete('/api/messages/:id', authenticateToken, async (req, res) => {
    const { data: msg } = await db.from('messages').select('sender_id').eq('id', req.params.id).single();

    if (!msg || msg.sender_id !== req.user.id) {
        return res.status(403).json({ error: 'Não permitido' });
    }

    await db.from('messages').update({ content: "Mensagem apagada!", is_deleted: 1 }).eq('id', req.params.id);
    res.json({ message: 'Mensagem excluída' });
});

app.get('/api/mail/unread', authenticateToken, async (req, res) => {
    try {
        const { count, error } = await db
            .from('mail')
            .select('*', { count: 'exact', head: true })
            .eq('recipient_id', req.user.id)
            .eq('is_read', 0)
            .eq('status_recipient', 'inbox');
        
        if (error) throw error;
        res.json({ count });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// --- MAIL ROUTES ---

app.get('/api/mail', authenticateToken, async (req, res) => {
    const { tab } = req.query; // 'inbox', 'sent', 'archived'
    try {
        let query;
        if (tab === 'inbox') {
            query = db.from('mail')
                .select('*, users!sender_id(name, avatar_url)')
                .eq('recipient_id', req.user.id)
                .eq('status_recipient', 'inbox');
        } else if (tab === 'sent') {
            query = db.from('mail')
                .select('*, users!recipient_id(name, avatar_url)')
                .eq('sender_id', req.user.id)
                .eq('status_sender', 'sent');
        } else if (tab === 'archived') {
            query = db.from('mail')
                .select('*, sender:users!sender_id(name), recipient:users!recipient_id(name)')
                .or(`and(recipient_id.eq.${req.user.id},status_recipient.eq.archived),and(sender_id.eq.${req.user.id},status_sender.eq.archived)`);
        }

        const { data: list, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;

        const formatted = list.map(m => ({
            ...m,
            from_name: m.users ? m.users.name : (m.sender ? m.sender.name : null),
            from_avatar: m.users ? m.users.avatar_url : null,
            to_name: m.users ? m.users.name : (m.recipient ? m.recipient.name : null),
            to_avatar: m.users ? m.users.avatar_url : null
        }));

        res.json(formatted);
    } catch (e) {
        console.error('[ERROR] Fetch mail:', e);
        res.status(500).json({ error: 'Erro ao buscar e-mails' });
    }
});

app.post('/api/mail', authenticateToken, async (req, res) => {
    const { recipient_id, subject, content } = req.body;
    try {
        const { error } = await db.from('mail').insert({
            sender_id: req.user.id,
            recipient_id,
            subject,
            content
        });
        if (error) throw error;
        res.json({ message: 'Mensagem enviada com sucesso' });
    } catch (e) {
        console.error('[ERROR] Send mail:', e);
        res.status(400).json({ error: 'Erro ao enviar mensagem' });
    }
});

app.put('/api/mail/:id', authenticateToken, async (req, res) => {
    const { action } = req.body; // 'read', 'archive', 'delete'
    try {
        const { data: mail } = await db.from('mail').select('*').eq('id', req.params.id).single();
        if (!mail) return res.status(404).json({ error: 'Mensagem não encontrada' });

        if (action === 'read') {
            if (mail.recipient_id === req.user.id) {
                await db.from('mail').update({ is_read: 1 }).eq('id', req.params.id);
            }
        } else if (action === 'archive') {
            if (mail.recipient_id === req.user.id) {
                await db.from('mail').update({ status_recipient: 'archived' }).eq('id', req.params.id);
            } else if (mail.sender_id === req.user.id) {
                await db.from('mail').update({ status_sender: 'archived' }).eq('id', req.params.id);
            }
        } else if (action === 'delete') {
            if (mail.recipient_id === req.user.id) {
                await db.from('mail').update({ status_recipient: 'deleted' }).eq('id', req.params.id);
            } else if (mail.sender_id === req.user.id) {
                await db.from('mail').update({ status_sender: 'deleted' }).eq('id', req.params.id);
            }
        }
        res.json({ message: 'Status atualizado' });
    } catch (e) {
        console.error('[ERROR] Update mail:', e);
        res.status(500).json({ error: 'Erro ao atualizar mensagem' });
    }
});

app.use(express.static(path.join(__dirname, '../dist')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
