import { ReactNode, createContext, useContext } from "react";

type Translations = {
  [key: string]: string;
};

const translations: Translations = {
  // Sidebar
  "nav.dashboard": "Painel",
  "nav.ponto": "Meu Ponto",
  "nav.agenda": "Agenda",
  "nav.tasks": "Tarefas",
  "nav.chat": "Chat",
  "nav.messages": "Mensagens",
  "nav.teams": "Equipes",
  "nav.dates": "Datas",
  "nav.admin": "Admin",
  "nav.settings": "Configurações",

  // Dashboard
  "dashboard.welcome": "Bom dia",
  "dashboard.summary": "Resumo do Dia",
  "dashboard.pendingTasks": "Tarefas Pendentes",
  "dashboard.upcomingMeetings": "Próximas Reuniões",
  "dashboard.unreadMessages": "Mensagens não Lidas",
  "dashboard.teamMembers": "Membros do Time",
  "dashboard.recentActivity": "Atividade Recente",
  "dashboard.birthdays": "Aniversariantes",
  "dashboard.quickActions": "Ações Rápidas",
  "dashboard.todayTasks": "Tarefas de Hoje",

  // Tasks
  "tasks.title": "Gestão de Tarefas",
  "tasks.list": "Lista",
  "tasks.kanban": "Kanban",
  "tasks.pending": "Pendente",
  "tasks.inProgress": "Em Andamento",
  "tasks.completed": "Concluída",
  "tasks.high": "Alta",
  "tasks.medium": "Média",
  "tasks.low": "Baixa",
  "tasks.urgent": "Urgente",
  "tasks.newTask": "Nova Tarefa",

  // Agenda
  "agenda.title": "Agenda",
  "agenda.newEvent": "Novo Evento",
  "agenda.today": "Hoje",

  // Chat
  "chat.title": "Chat Interno",
  "chat.online": "Online",
  "chat.typeMessage": "Digite uma mensagem...",

  // VideoChat
  "nav.videochat": "VideoChamada",

  // Messages
  "messages.title": "Mensagens",
  "messages.inbox": "Caixa de Entrada",
  "messages.sent": "Enviados",
  "messages.archived": "Arquivados",
  "messages.compose": "Nova Mensagem",

  // Teams
  "teams.title": "Equipes",
  "teams.members": "membros",

  // Dates
  "dates.title": "Datas Comemorativas",
  "dates.birthdays": "Aniversários",
  "dates.companyDates": "Datas da Empresa",

  // Common
  "common.search": "Buscar...",
  "common.noData": "Nenhum dado encontrado",
  "common.viewAll": "Ver Todos",
  "common.today": "Hoje",
  "common.tomorrow": "Amanhã",
};

interface I18nContextType {
  language: string;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const t = (key: string): string => {
    return translations[key] || key;
  };

  return (
    <I18nContext.Provider value={{ language: "pt", t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used within I18nProvider");
  return context;
}
