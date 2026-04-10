-- Limpeza (Opcional, caso queira recriar do zero)
DROP TABLE IF EXISTS company_dates;
DROP TABLE IF EXISTS birthdays;
DROP TABLE IF EXISTS mail;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS agenda;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS teams;

-- 1. Criar tabela de Equipes
CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    color TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Criar tabela de Usuários
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT,
    email TEXT,
    role TEXT DEFAULT 'employee',
    avatar_url TEXT,
    team_id INTEGER REFERENCES teams(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Criar tabela de Agenda
CREATE TABLE agenda (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    event_time TEXT,
    event_type TEXT DEFAULT 'lembrete',
    recurrence TEXT DEFAULT 'none',
    reminder_days INTEGER DEFAULT 3,
    color TEXT
);

-- 4. Criar tabela de Tarefas
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'pending',
    deadline TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. Criar tabela de Mensagens (Chat)
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL,
    target_id INTEGER,
    content TEXT NOT NULL,
    is_deleted INTEGER DEFAULT 0,
    is_edited INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    is_read INTEGER DEFAULT 0
);

-- 6. Criar tabela de Mail
CREATE TABLE mail (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    recipient_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    status_sender TEXT DEFAULT 'sent',
    status_recipient TEXT DEFAULT 'inbox',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. Criar tabela de Aniversários
CREATE TABLE birthdays (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    birth_date DATE NOT NULL,
    department TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 8. Criar tabela de Datas Comemorativas
CREATE TABLE company_dates (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    event_date DATE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 9. Criar tabela de Mural (Avisos)
CREATE TABLE bulletins (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT,
    category TEXT NOT NULL CHECK (category IN ('noticia', 'beneficio', 'aviso')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 10. Criar tabela de Faltas (Atualizada para suportar Justificativas Dinâmicas)
CREATE TABLE absences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    absence_date DATE NOT NULL,
    end_date DATE, -- Opcional, usado para períodos como férias 
    reason TEXT,
    category TEXT, -- Ex: 'Saúde', 'Família', 'Férias'
    status TEXT DEFAULT 'Pendente', -- Pendente, Aprovado, Negado
    attachment_url TEXT,
    metadata JSONB, -- Armazenamento flexível de CRM, CID, Parentesco, etc.
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================================
-- SCRIPT DE ATUALIZAÇÃO (RODAR NO SUPABASE SE A TABELA JÁ EXISTIR)
-- =====================================================================
/*
ALTER TABLE absences 
  ADD COLUMN category TEXT,
  ADD COLUMN end_date DATE,
  ADD COLUMN status TEXT DEFAULT 'Pendente',
  ADD COLUMN attachment_url TEXT,
  ADD COLUMN metadata JSONB;
*/

-- 11. Criar tabela de Atestados Médicos (Opcional caso opte por usar a de absences concentrada)
CREATE TABLE medical_certificates (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX idx_messages_target ON messages(target_type, target_id);
CREATE INDEX idx_mail_recipient ON mail(recipient_id);
CREATE INDEX idx_tasks_user ON tasks(user_id);
CREATE INDEX idx_agenda_user ON agenda(user_id);
CREATE INDEX idx_absences_user ON absences(user_id);
CREATE INDEX idx_medical_cert_user ON medical_certificates(user_id);
