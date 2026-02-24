import { useI18n } from "@/contexts/I18nContext";
import { Plus, Filter, LayoutList, Columns3 } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";

const fadeIn = { initial: { opacity: 0, y: 12 } as const, animate: { opacity: 1, y: 0 } as const, transition: { duration: 0.4 } };

type TaskStatus = "pending" | "inProgress" | "completed";

interface Task {
  id: number;
  title: string;
  priority: "urgent" | "high" | "medium" | "low";
  status: TaskStatus;
  assignee: string;
  deadline: string;
}

const mockTasks: Task[] = [
  { id: 1, title: "Revisar relatório financeiro Q4", priority: "urgent", status: "pending", assignee: "Maria S.", deadline: "25 Fev" },
  { id: 2, title: "Atualizar landing page", priority: "high", status: "inProgress", assignee: "João P.", deadline: "26 Fev" },
  { id: 3, title: "Preparar apresentação de produto", priority: "medium", status: "pending", assignee: "Ana L.", deadline: "27 Fev" },
  { id: 4, title: "Configurar CI/CD pipeline", priority: "high", status: "inProgress", assignee: "Carlos R.", deadline: "28 Fev" },
  { id: 5, title: "Testes de integração", priority: "medium", status: "completed", assignee: "Fernanda C.", deadline: "24 Fev" },
  { id: 6, title: "Documentação da API", priority: "low", status: "pending", assignee: "Ricardo A.", deadline: "01 Mar" },
];

const priorityConfig: Record<string, { label: string; class: string }> = {
  urgent: { label: "Urgente", class: "bg-destructive/15 text-destructive" },
  high: { label: "Alta", class: "bg-warning/15 text-warning" },
  medium: { label: "Média", class: "bg-primary/15 text-primary" },
  low: { label: "Baixa", class: "bg-success/15 text-success" },
};

const statusConfig: Record<TaskStatus, { label: string; class: string }> = {
  pending: { label: "Pendente", class: "bg-muted text-muted-foreground" },
  inProgress: { label: "Em Andamento", class: "bg-accent/15 text-accent" },
  completed: { label: "Concluída", class: "bg-success/15 text-success" },
};

function KanbanColumn({ title, tasks, status }: { title: string; tasks: Task[]; status: string }) {
  const filtered = tasks.filter((t) => t.status === status);
  return (
    <div className="flex-1 min-w-[280px]">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground font-medium">
          {filtered.length}
        </span>
      </div>
      <div className="space-y-2">
        {filtered.map((task) => (
          <div key={task.id} className="glass-card rounded-lg border border-border p-4 cursor-pointer hover:scale-[1.01] transition-transform">
            <p className="text-sm font-medium text-foreground mb-2">{task.title}</p>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${priorityConfig[task.priority].class}`}>
                {priorityConfig[task.priority].label}
              </span>
              <span className="text-xs text-muted-foreground">{task.deadline}</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[8px] font-bold text-muted-foreground">
                {task.assignee.split(" ").map((w) => w[0]).join("")}
              </div>
              <span className="text-xs text-muted-foreground">{task.assignee}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TasksPage() {
  const { t } = useI18n();
  const [view, setView] = useState<"list" | "kanban">("kanban");

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <motion.div {...fadeIn} className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t("tasks.title")}</h1>
        <div className="flex items-center gap-2">
          <div className="flex border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setView("list")}
              className={cn("p-2 transition-colors", view === "list" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-muted/50")}
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView("kanban")}
              className={cn("p-2 transition-colors", view === "kanban" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-muted/50")}
            >
              <Columns3 className="w-4 h-4" />
            </button>
          </div>
          <button className="p-2 rounded-lg border border-border text-muted-foreground hover:bg-muted/50 transition-colors">
            <Filter className="w-4 h-4" />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-brand text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" /> {t("tasks.newTask")}
          </button>
        </div>
      </motion.div>

      {view === "kanban" ? (
        <motion.div {...fadeIn} className="flex gap-4 overflow-x-auto pb-4">
          <KanbanColumn title={t("tasks.pending")} tasks={mockTasks} status="pending" />
          <KanbanColumn title={t("tasks.inProgress")} tasks={mockTasks} status="inProgress" />
          <KanbanColumn title={t("tasks.completed")} tasks={mockTasks} status="completed" />
        </motion.div>
      ) : (
        <motion.div {...fadeIn} className="glass-card rounded-xl border border-border">
          <div className="divide-y divide-border">
            {mockTasks.map((task) => (
              <div key={task.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors">
                <div className={cn("w-5 h-5 rounded border-2 shrink-0", task.status === "completed" ? "bg-success border-success" : "border-muted-foreground/30")} />
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-medium truncate", task.status === "completed" ? "text-muted-foreground line-through" : "text-foreground")}>
                    {task.title}
                  </p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${priorityConfig[task.priority].class}`}>
                  {priorityConfig[task.priority].label}
                </span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusConfig[task.status].class}`}>
                  {statusConfig[task.status].label}
                </span>
                <span className="text-xs text-muted-foreground">{task.assignee}</span>
                <span className="text-xs text-muted-foreground">{task.deadline}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
