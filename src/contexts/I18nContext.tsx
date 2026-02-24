import { ReactNode, createContext, useContext, useState } from "react";

type Language = "pt" | "en" | "es";

type Translations = {
  [key: string]: { pt: string; en: string; es: string };
};

const translations: Translations = {
  // Sidebar
  "nav.dashboard": { pt: "Painel", en: "Dashboard", es: "Panel" },
  "nav.agenda": { pt: "Agenda", en: "Agenda", es: "Agenda" },
  "nav.tasks": { pt: "Tarefas", en: "Tasks", es: "Tareas" },
  "nav.chat": { pt: "Chat", en: "Chat", es: "Chat" },
  "nav.messages": { pt: "Mensagens", en: "Messages", es: "Mensajes" },
  "nav.teams": { pt: "Times", en: "Teams", es: "Equipos" },
  "nav.dates": { pt: "Datas", en: "Dates", es: "Fechas" },
  "nav.admin": { pt: "Admin", en: "Admin", es: "Admin" },
  "nav.settings": { pt: "Configurações", en: "Settings", es: "Ajustes" },

  // Dashboard
  "dashboard.welcome": { pt: "Bom dia", en: "Good morning", es: "Buenos días" },
  "dashboard.summary": { pt: "Resumo do Dia", en: "Daily Summary", es: "Resumen del Día" },
  "dashboard.pendingTasks": { pt: "Tarefas Pendentes", en: "Pending Tasks", es: "Tareas Pendientes" },
  "dashboard.upcomingMeetings": { pt: "Próximas Reuniões", en: "Upcoming Meetings", es: "Próximas Reuniones" },
  "dashboard.unreadMessages": { pt: "Mensagens não Lidas", en: "Unread Messages", es: "Mensajes sin Leer" },
  "dashboard.teamMembers": { pt: "Membros do Time", en: "Team Members", es: "Miembros del Equipo" },
  "dashboard.recentActivity": { pt: "Atividade Recente", en: "Recent Activity", es: "Actividad Reciente" },
  "dashboard.birthdays": { pt: "Aniversariantes", en: "Birthdays", es: "Cumpleaños" },
  "dashboard.quickActions": { pt: "Ações Rápidas", en: "Quick Actions", es: "Acciones Rápidas" },
  "dashboard.todayTasks": { pt: "Tarefas de Hoje", en: "Today's Tasks", es: "Tareas de Hoy" },

  // Tasks
  "tasks.title": { pt: "Gestão de Tarefas", en: "Task Management", es: "Gestión de Tareas" },
  "tasks.list": { pt: "Lista", en: "List", es: "Lista" },
  "tasks.kanban": { pt: "Kanban", en: "Kanban", es: "Kanban" },
  "tasks.pending": { pt: "Pendente", en: "Pending", es: "Pendiente" },
  "tasks.inProgress": { pt: "Em Andamento", en: "In Progress", es: "En Progreso" },
  "tasks.completed": { pt: "Concluída", en: "Completed", es: "Completada" },
  "tasks.high": { pt: "Alta", en: "High", es: "Alta" },
  "tasks.medium": { pt: "Média", en: "Medium", es: "Media" },
  "tasks.low": { pt: "Baixa", en: "Low", es: "Baja" },
  "tasks.urgent": { pt: "Urgente", en: "Urgent", es: "Urgente" },
  "tasks.newTask": { pt: "Nova Tarefa", en: "New Task", es: "Nueva Tarea" },

  // Agenda
  "agenda.title": { pt: "Agenda", en: "Agenda", es: "Agenda" },
  "agenda.newEvent": { pt: "Novo Evento", en: "New Event", es: "Nuevo Evento" },
  "agenda.today": { pt: "Hoje", en: "Today", es: "Hoy" },

  // Chat
  "chat.title": { pt: "Chat Interno", en: "Internal Chat", es: "Chat Interno" },
  "chat.online": { pt: "Online", en: "Online", es: "En Línea" },
  "chat.typeMessage": { pt: "Digite uma mensagem...", en: "Type a message...", es: "Escribe un mensaje..." },

  // Messages
  "messages.title": { pt: "Mensagens", en: "Messages", es: "Mensajes" },
  "messages.inbox": { pt: "Caixa de Entrada", en: "Inbox", es: "Bandeja de Entrada" },
  "messages.sent": { pt: "Enviados", en: "Sent", es: "Enviados" },
  "messages.archived": { pt: "Arquivados", en: "Archived", es: "Archivados" },
  "messages.compose": { pt: "Nova Mensagem", en: "New Message", es: "Nuevo Mensaje" },

  // Teams
  "teams.title": { pt: "Times", en: "Teams", es: "Equipos" },
  "teams.members": { pt: "membros", en: "members", es: "miembros" },

  // Dates
  "dates.title": { pt: "Datas Comemorativas", en: "Important Dates", es: "Fechas Importantes" },
  "dates.birthdays": { pt: "Aniversários", en: "Birthdays", es: "Cumpleaños" },
  "dates.companyDates": { pt: "Datas da Empresa", en: "Company Dates", es: "Fechas de la Empresa" },

  // Common
  "common.search": { pt: "Buscar...", en: "Search...", es: "Buscar..." },
  "common.noData": { pt: "Nenhum dado encontrado", en: "No data found", es: "No se encontraron datos" },
  "common.viewAll": { pt: "Ver Todos", en: "View All", es: "Ver Todos" },
  "common.today": { pt: "Hoje", en: "Today", es: "Hoy" },
  "common.tomorrow": { pt: "Amanhã", en: "Tomorrow", es: "Mañana" },
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("pt");

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used within I18nProvider");
  return context;
}
