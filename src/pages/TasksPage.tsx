import { useState, useEffect } from "react";
import { Plus, Filter, LayoutList, Columns3, Trash2, Clock, AlertCircle, CheckCircle2, PauseCircle, XCircle, Loader2, Calendar as CalendarIcon, ChevronDown, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn, safeDate } from "@/lib/utils";
import { useI18n } from "@/contexts/I18nContext";
import * as Popover from "@radix-ui/react-popover";
import { DayPicker } from "react-day-picker";
import { ptBR } from "date-fns/locale";
import { format } from "date-fns";
import "react-day-picker/dist/style.css";

const fadeIn = { initial: { opacity: 0, y: 12 } as const, animate: { opacity: 1, y: 0 } as const, transition: { duration: 0.4 } };

type TaskStatus = "pending" | "inProgress" | "paused" | "cancelled" | "completed";
type TaskPriority = "urgent" | "high" | "medium" | "low";

interface Task {
  id: number;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  deadline: string;
  created_at: string;
}

const priorityConfig: Record<TaskPriority, { label: string; class: string; color: string }> = {
  urgent: { label: "Urgente", class: "bg-red-500/15 text-red-500 border-red-500/30", color: "#ef4444" },
  high: { label: "Alta", class: "bg-orange-500/15 text-orange-500 border-orange-500/30", color: "#f97316" },
  medium: { label: "Média", class: "bg-blue-400/15 text-blue-400 border-blue-400/30", color: "#60a5fa" },
  low: { label: "Baixa", class: "bg-green-500/15 text-green-500 border-green-500/30", color: "#22c55e" },
};

const statusConfig: Record<TaskStatus, { label: string; class: string; icon: any }> = {
  pending: { label: "Aguardando", class: "bg-muted text-muted-foreground", icon: Clock },
  inProgress: { label: "Em Andamento", class: "bg-blue-500/15 text-blue-500", icon: Loader2 },
  paused: { label: "Pausada", class: "bg-yellow-500/15 text-yellow-500", icon: PauseCircle },
  cancelled: { label: "Cancelada", class: "bg-red-500/15 text-red-500", icon: XCircle },
  completed: { label: "Concluída", class: "bg-green-500/15 text-green-500", icon: CheckCircle2 },
};

export default function TasksPage() {
  const { api } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "kanban">("kanban");
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showStatusFilterModal, setShowStatusFilterModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | null>(null);

  // Modal States
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedPriority, setSelectedPriority] = useState<TaskPriority>("medium");
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus>("pending");

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setSelectedDate(task.deadline ? new Date(task.deadline) : undefined);
    setSelectedPriority(task.priority);
    setSelectedStatus(task.status);
    setShowModal(true);
  };

  const openNewModal = () => {
    setEditingTask(null);
    setSelectedDate(new Date());
    setSelectedPriority("medium");
    setSelectedStatus("pending");
    setShowModal(true);
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const data = await api("/api/tasks");
      setTasks(data);
    } catch (error) {
      console.error("Erro ao carregar tarefas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    const taskData = {
      ...data,
      priority: selectedPriority,
      status: selectedStatus,
      deadline: selectedDate ? format(selectedDate, "yyyy-MM-dd") : null
    };

    try {
      const endpoint = editingTask ? `/api/tasks/${editingTask.id}` : "/api/tasks";
      const method = editingTask ? "PUT" : "POST";

      await api(endpoint, {
        method,
        body: JSON.stringify(taskData),
      });

      toast.success(editingTask ? "Tarefa atualizada!" : "Tarefa cadastrada com sucesso!");
      setShowModal(false);
      setEditingTask(null);
      fetchTasks();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Excluir esta tarefa permanentemente?")) return;
    try {
      await api(`/api/tasks/${id}`, { method: "DELETE" });
      toast.success("Tarefa removida");
      fetchTasks();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <motion.div {...fadeIn} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <LayoutList className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Gestão de Tarefas</h1>
            <p className="text-xs text-muted-foreground mt-0.5 italic">Controle de criticidade e prazos</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-card border border-border rounded-xl p-1 shadow-sm">
            <button
              onClick={() => setView("list")}
              className={cn("p-2 rounded-lg transition-all", view === "list" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-muted/50")}
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView("kanban")}
              className={cn("p-2 rounded-lg transition-all", view === "kanban" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-muted/50")}
            >
              <Columns3 className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={openNewModal}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-brand text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all active:translate-y-0"
          >
            <Plus className="w-5 h-5" /> Nova Tarefa
          </button>
        </div>
      </motion.div>

      {/* Resumo de Status */}
      <motion.div {...fadeIn} className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { id: "pending", label: "Aguardando", icon: Clock, color: "text-muted-foreground", bg: "bg-muted/10" },
          { id: "inProgress", label: "Em curso", icon: Loader2, color: "text-blue-500", bg: "bg-blue-500/10" },
          { id: "paused", label: "Pausadas", icon: PauseCircle, color: "text-yellow-500", bg: "bg-yellow-500/10" },
          { id: "cancelled", label: "Canceladas", icon: XCircle, color: "text-red-500", bg: "bg-red-500/10" },
          { id: "completed", label: "Concluídas", icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" },
        ].map((stat) => (
          <div
            key={stat.id}
            onClick={() => {
              setStatusFilter(stat.id as TaskStatus);
              setShowStatusFilterModal(true);
            }}
            className="glass-card rounded-2xl border border-border p-4 flex items-center justify-between shadow-sm cursor-pointer hover:border-primary/50 hover:shadow-lg transition-all active:scale-[0.98] group"
          >
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg transition-colors group-hover:bg-primary/10", stat.bg)}>
                <stat.icon className={cn("w-4 h-4", stat.id === 'inProgress' && 'animate-spin', stat.color)} />
              </div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">{stat.label}</span>
            </div>
            <span className="text-lg font-black text-foreground">
              {tasks.filter(t => t.status === stat.id).length}
            </span>
          </div>
        ))}
      </motion.div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 opacity-50">
          <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
          <p className="text-sm font-bold">Sincronizando tarefas...</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {view === "kanban" ? (
            <motion.div
              key="kanban"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pb-6"
            >
              <KanbanColumn title="Pendente" status="pending" tasks={tasks} onDelete={handleDelete} onEdit={openEditModal} />
              <KanbanColumn title="Em Andamento" status="inProgress" tasks={tasks} onDelete={handleDelete} onEdit={openEditModal} />
              <KanbanColumn title="Pausada" status="paused" tasks={tasks} onDelete={handleDelete} onEdit={openEditModal} />
              <KanbanColumn title="Concluída" status="completed" tasks={tasks} onDelete={handleDelete} onEdit={openEditModal} />
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              className="glass-card rounded-[2rem] border border-border shadow-xl overflow-hidden"
            >
              <div className="divide-y divide-border">
                {tasks.length === 0 ? (
                  <div className="py-20 text-center opacity-50 italic">Nenhuma tarefa encontrada.</div>
                ) : (
                  tasks.map((task) => (
                    <div key={task.id} className="group flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-all cursor-pointer" onClick={() => openEditModal(task)}>
                      <div className="w-1.5 h-10 rounded-full shrink-0" style={{ backgroundColor: priorityConfig[task.priority].color }} />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-foreground truncate">{task.title}</h3>
                        <p className="text-[10px] text-muted-foreground italic truncate">{task.description || "Sem descrição"}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={cn("text-[9px] font-black px-2.5 py-1 rounded-full border uppercase tracking-widest", priorityConfig[task.priority].class)}>
                          {priorityConfig[task.priority].label}
                        </span>
                        <span className={cn("flex items-center gap-1.5 text-[9px] font-bold px-2.5 py-1 rounded-full uppercase", statusConfig[task.status].class)}>
                          {(() => {
                            const Icon = statusConfig[task.status].icon;
                            return <Icon className={cn("w-3 h-3", task.status === 'inProgress' && 'animate-spin')} />;
                          })()}
                          {statusConfig[task.status].label}
                        </span>
                        <div className="flex flex-col items-end min-w-[80px]">
                          <span className="text-[10px] text-muted-foreground font-bold flex items-center gap-1">
                            <CalendarIcon className="w-3 h-3" /> {task.deadline ? format(safeDate(task.deadline), "dd/MM") : "--/--"}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDelete(task.id)}
                          className="p-2 rounded-lg hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )
          }
        </AnimatePresence>
      )}

      {/* MODAL NOVA TAREFA */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl glass-card rounded-[2.5rem] border border-border shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8 text-foreground">
                  <h2 className="text-2xl font-bold">{editingTask ? "Editar Tarefa" : "Nova Tarefa"}</h2>
                  <button onClick={() => setShowModal(false)} className="p-2 hover:bg-muted rounded-full transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">O que precisa ser feito?</label>
                    <input name="title" required defaultValue={editingTask?.title || ""} placeholder="Título da tarefa..." className="w-full px-5 py-3 rounded-lg bg-card border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all text-white placeholder:text-muted-foreground/30" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Detalhes (Opcional)</label>
                    <textarea name="description" defaultValue={editingTask?.description || ""} rows={2} className="w-full px-5 py-3 rounded-lg bg-card border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all text-white resize-none" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Criticidade / Prioridade</label>
                      <div className="relative">
                        <select
                          value={selectedPriority}
                          onChange={(e) => setSelectedPriority(e.target.value as TaskPriority)}
                          className="w-full px-5 py-3 rounded-lg bg-card border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer text-foreground"
                        >
                          <option value="urgent">🔴 URGENTE</option>
                          <option value="high">🟡 ALTA</option>
                          <option value="medium">🔵 MÉDIA</option>
                          <option value="low">🟢 BAIXA</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Status Inicial</label>
                      <div className="relative">
                        <select
                          value={selectedStatus}
                          onChange={(e) => setSelectedStatus(e.target.value as TaskStatus)}
                          className="w-full px-5 py-3 rounded-lg bg-card border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer text-foreground"
                        >
                          <option value="pending">Aguardando</option>
                          <option value="inProgress">Em Andamento</option>
                          <option value="paused">Pausada</option>
                          <option value="cancelled">Cancelada</option>
                          <option value="completed">Concluída</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Prazo / Meta para Conclusão</label>
                    <Popover.Root>
                      <Popover.Trigger asChild>
                        <button type="button" className="w-full px-5 py-3 rounded-lg bg-card border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all text-white flex items-center justify-between hover:bg-muted/20">
                          {selectedDate ? format(selectedDate, "dd/MM/yyyy") : "Sem prazo definido"}
                          <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </Popover.Trigger>
                      <Popover.Portal>
                        <Popover.Content className="z-[100] bg-card border border-border p-4 rounded-xl shadow-2xl" sideOffset={5}>
                          <style>{`
                            .rdp-caption_label { text-transform: capitalize; font-weight: 800; }
                          `}</style>
                          <DayPicker mode="single" selected={selectedDate} onSelect={setSelectedDate} locale={ptBR} />
                        </Popover.Content>
                      </Popover.Portal>
                    </Popover.Root>
                  </div>

                  <button
                    disabled={isSubmitting}
                    className="w-full py-4 mt-4 gradient-brand text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/30 transition-all flex items-center justify-center gap-2 group hover:-translate-y-1 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6 group-hover:scale-110 transition-transform" />}
                    {editingTask ? "Salvar Alterações" : "Confirmar Registro"}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Tarefas por Status */}
      <AnimatePresence>
        {showStatusFilterModal && statusFilter && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowStatusFilterModal(false)}
              className="absolute inset-0 bg-background/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl max-h-[80vh] flex flex-col glass-card rounded-[2rem] border border-border shadow-2xl overflow-hidden"
            >
              <div className={cn("p-6 border-b border-border flex items-center justify-between", statusConfig[statusFilter].class.replace('/15', '/5'))}>
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg", statusConfig[statusFilter].class)}>
                    {(() => {
                      const Icon = statusConfig[statusFilter].icon;
                      return <Icon className={cn("w-6 h-6", statusFilter === 'inProgress' && 'animate-spin')} />;
                    })()}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{statusConfig[statusFilter].label}</h2>
                    <p className="text-xs text-muted-foreground">Exibindo todas as tarefas neste status</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowStatusFilterModal(false)}
                  className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {tasks.filter(t => t.status === statusFilter).length === 0 ? (
                  <div className="py-20 text-center opacity-50 italic text-sm">Nenhuma tarefa encontrada.</div>
                ) : (
                  tasks.filter(t => t.status === statusFilter).map((task) => (
                    <div
                      key={task.id}
                      onClick={() => {
                        setShowStatusFilterModal(false);
                        openEditModal(task);
                      }}
                      className="group p-4 rounded-2xl bg-muted/30 border border-border hover:border-primary/30 transition-all flex flex-col sm:flex-row sm:items-center gap-4 cursor-pointer"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn("text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider", priorityConfig[task.priority].class)}>
                            {priorityConfig[task.priority].label}
                          </span>
                          <h3 className="text-sm font-bold text-foreground truncate">{task.title}</h3>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">{task.description || "Sem descrição"}</p>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <div className="flex flex-col items-end">
                          <div className="text-xs font-bold text-foreground">
                            {task.deadline ? format(safeDate(task.deadline), "dd/MM/yyyy") : "--/--/----"}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">Prazo Final</div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(task.id);
                          }}
                          className="p-2 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 bg-muted/50 border-t border-border flex justify-end">
                <button
                  onClick={() => setShowStatusFilterModal(false)}
                  className="px-6 py-2 rounded-xl bg-foreground text-background text-sm font-bold hover:opacity-90 transition-opacity"
                >
                  Fechar Visualização
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function KanbanColumn({ title, status, tasks, onDelete, onEdit }: { title: string; status: TaskStatus; tasks: Task[]; onDelete: (id: number) => void; onEdit: (task: Task) => void }) {
  const filtered = tasks.filter(t => t.status === status);

  return (
    <div className="flex-1 min-w-0 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-6 px-2">
        <h3 className="text-sm font-bold text-foreground">
          {title}
        </h3>
        <span className="text-[10px] bg-muted/30 px-2 py-0.5 rounded-full text-muted-foreground font-black">
          {filtered.length}
        </span>
      </div>

      <div className="space-y-4">
        {filtered.map(task => (
          <motion.div
            layout
            key={task.id}
            onClick={() => onEdit(task)}
            className="group glass-card rounded-2xl border border-border p-5 shadow-lg hover:shadow-primary/5 transition-all cursor-pointer relative overflow-hidden"
            style={{ borderBottom: `3px solid ${priorityConfig[task.priority].color}` }}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <p className="text-sm font-bold text-foreground leading-snug line-clamp-2 flex-1">{task.title}</p>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
                className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center justify-between mb-4">
              <span className={cn("text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider", priorityConfig[task.priority].class)}>
                {priorityConfig[task.priority].label}
              </span>
              <div className="text-[10px] text-muted-foreground font-medium">
                {task.deadline ? format(new Date(task.deadline), "dd MMM", { locale: ptBR }) : "-- ---"}
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black shadow-sm text-foreground/80"
                style={{ backgroundColor: `${priorityConfig[task.priority].color}33` }}
              >
                {task.title.substring(0, 2).toUpperCase()}
              </div>
              <span className="text-[11px] text-muted-foreground font-semibold">Equipe Anteffa</span>
            </div>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="py-20 text-center opacity-20 italic text-xs border border-dashed border-border rounded-2xl">Vazio</div>
        )}
      </div>
    </div>
  );
}
