import { useI18n } from "@/contexts/I18nContext";
import {
  CheckSquare,
  Calendar,
  Mail,
  Users,
  ArrowUpRight,
  Clock,
  Cake,
  Plus,
  TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";

const fadeIn = (delay: number) => ({
  initial: { opacity: 0, y: 12 } as const,
  animate: { opacity: 1, y: 0 } as const,
  transition: { duration: 0.4, delay, ease: "easeOut" as const },
});

function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  color,
  delay,
}: {
  icon: any;
  label: string;
  value: string;
  trend?: string;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      {...fadeIn(delay)}
      className="glass-card rounded-xl p-5 border border-border"
    >
      <div className="flex items-start justify-between">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}
        >
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span className="flex items-center gap-1 text-xs font-medium text-success">
            <TrendingUp className="w-3 h-3" /> {trend}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
      </div>
    </motion.div>
  );
}

const mockTasks = [
  { title: "Revisar relatório Q4", priority: "high", time: "09:00" },
  { title: "Reunião com equipe de produto", priority: "medium", time: "10:30" },
  { title: "Atualizar documentação", priority: "low", time: "14:00" },
  { title: "Deploy versão 2.3", priority: "urgent", time: "16:00" },
];

const mockActivity = [
  { user: "Maria S.", action: "completou tarefa", target: "Design Sprint", time: "5 min" },
  { user: "João P.", action: "enviou mensagem", target: "Canal Geral", time: "12 min" },
  { user: "Ana L.", action: "criou reunião", target: "Planning Q1", time: "30 min" },
  { user: "Carlos R.", action: "atualizou", target: "Roadmap 2026", time: "1h" },
];

const mockBirthdays = [
  { name: "Fernanda Costa", date: "Hoje", avatar: "FC" },
  { name: "Ricardo Alves", date: "Amanhã", avatar: "RA" },
  { name: "Juliana Mendes", date: "27 Fev", avatar: "JM" },
];

const priorityColors: Record<string, string> = {
  urgent: "bg-destructive/15 text-destructive",
  high: "bg-warning/15 text-warning",
  medium: "bg-primary/15 text-primary",
  low: "bg-success/15 text-success",
};

export default function Dashboard() {
  const { t } = useI18n();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div {...fadeIn(0)}>
        <h1 className="text-2xl font-bold text-foreground">
          {t("dashboard.welcome")}, <span className="text-gradient-brand">Usuário</span> 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t("dashboard.summary")} — 24 de Fevereiro, 2026
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={CheckSquare}
          label={t("dashboard.pendingTasks")}
          value="12"
          trend="+3"
          color="bg-primary/15 text-primary"
          delay={0.05}
        />
        <StatCard
          icon={Calendar}
          label={t("dashboard.upcomingMeetings")}
          value="4"
          color="bg-accent/15 text-accent"
          delay={0.1}
        />
        <StatCard
          icon={Mail}
          label={t("dashboard.unreadMessages")}
          value="8"
          trend="+2"
          color="bg-warning/15 text-warning"
          delay={0.15}
        />
        <StatCard
          icon={Users}
          label={t("dashboard.teamMembers")}
          value="24"
          color="bg-success/15 text-success"
          delay={0.2}
        />
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Tasks */}
        <motion.div
          {...fadeIn(0.25)}
          className="lg:col-span-2 glass-card rounded-xl border border-border"
        >
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h2 className="font-semibold text-foreground">{t("dashboard.todayTasks")}</h2>
            <button className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors">
              {t("common.viewAll")} <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-border">
            {mockTasks.map((task, i) => (
              <div
                key={i}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors"
              >
                <div className="w-5 h-5 rounded border-2 border-muted-foreground/30 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {task.title}
                  </p>
                </div>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${priorityColors[task.priority]}`}
                >
                  {task.priority}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" /> {task.time}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Birthdays */}
        <motion.div
          {...fadeIn(0.3)}
          className="glass-card rounded-xl border border-border"
        >
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Cake className="w-4 h-4 text-accent" />
              {t("dashboard.birthdays")}
            </h2>
          </div>
          <div className="divide-y divide-border">
            {mockBirthdays.map((b, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                <div className="w-9 h-9 rounded-full gradient-brand flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
                  {b.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{b.name}</p>
                  <p className="text-xs text-muted-foreground">{b.date}</p>
                </div>
                <span className="text-lg">🎂</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          {...fadeIn(0.35)}
          className="lg:col-span-2 glass-card rounded-xl border border-border"
        >
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h2 className="font-semibold text-foreground">{t("dashboard.recentActivity")}</h2>
          </div>
          <div className="divide-y divide-border">
            {mockActivity.map((a, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs font-bold shrink-0">
                  {a.user
                    .split(" ")
                    .map((w) => w[0])
                    .join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">{a.user}</span>{" "}
                    <span className="text-muted-foreground">{a.action}</span>{" "}
                    <span className="font-medium text-primary">{a.target}</span>
                  </p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{a.time}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          {...fadeIn(0.4)}
          className="glass-card rounded-xl border border-border p-5"
        >
          <h2 className="font-semibold text-foreground mb-4">{t("dashboard.quickActions")}</h2>
          <div className="space-y-2">
            {[
              { label: t("tasks.newTask"), icon: CheckSquare },
              { label: t("agenda.newEvent"), icon: Calendar },
              { label: t("messages.compose"), icon: Mail },
            ].map((action, i) => (
              <button
                key={i}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-border hover:bg-muted/50 transition-colors text-sm font-medium text-foreground"
              >
                <Plus className="w-4 h-4 text-primary" />
                {action.label}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
