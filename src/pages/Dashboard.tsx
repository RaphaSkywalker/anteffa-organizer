import { useState, useEffect, useRef } from "react";
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
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Bell,
  MoreVertical,
  Play,
  Download
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn, safeDate } from "@/lib/utils";

const fadeIn = (delay: number) => ({
  initial: { opacity: 0, y: 20 } as const,
  animate: { opacity: 1, y: 0 } as const,
  transition: { duration: 0.5, delay, ease: "easeOut" as const },
});

interface Task {
  id: number;
  title: string;
  description: string;
  priority: "urgent" | "high" | "medium" | "low";
  status: "pending" | "inProgress" | "paused" | "cancelled" | "completed";
  deadline: string;
}

interface AgendaEvent {
  id: number;
  title: string;
  description: string;
  start_date: string;
  event_time: string;
  event_type: string;
  color: string;
  reminder_days?: number;
}

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
  avatar_url?: string;
  team_name?: string;
}

function DonezoStatCard({
  icon: Icon,
  label,
  value,
  trend,
  delay,
  primary = false
}: {
  icon: any;
  label: string;
  value: string;
  trend?: string;
  delay: number;
  primary?: boolean;
}) {
  return (
    <motion.div
      {...fadeIn(delay)}
      className={cn(
        "relative p-6 rounded-[1.25rem] border transition-all duration-300 group overflow-hidden h-full min-h-[160px]",
        primary 
          ? "bg-primary text-primary-foreground border-primary shadow-xl shadow-primary/20" 
          : "bg-card text-foreground border-border hover:border-primary/30 shadow-sm"
      )}
    >
      <div className="flex items-start justify-between relative z-10">
        <div className="flex flex-col">
           <span className={cn("text-sm font-bold opacity-80", primary ? "text-primary-foreground/70" : "text-muted-foreground transition-colors group-hover:text-primary")}>{label}</span>
           <span className="text-4xl font-black mt-2 tracking-tighter">{value}</span>
        </div>
        <div className={cn(
           "w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-300",
           primary ? "bg-white/15 border-white/20" : "bg-muted/50 border-border group-hover:bg-primary group-hover:border-primary group-hover:text-white"
        )}>
           <ArrowUpRight className="w-5 h-5" />
        </div>
      </div>
      
      {trend && (
         <div className="mt-4 flex items-center gap-1.5 relative z-10">
            <div className={cn("px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider", primary ? "bg-white/20" : "bg-primary/10 text-primary")}>
               {trend}
            </div>
            <span className={cn("text-[10px] font-medium opacity-60", primary ? "text-primary-foreground/50" : "text-muted-foreground italic")}>em relação ao mês anterior</span>
         </div>
      )}

      {/* Decorative Orbs */}
      {primary && (
         <>
            <div className="absolute -top-4 -right-4 w-32 h-32 bg-white/10 blur-3xl rounded-full pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-black/10 blur-3xl rounded-full pointer-events-none" />
         </>
      )}
    </motion.div>
  );
}

export default function Dashboard() {
  const { t } = useI18n();
  const { user, api } = useAuth();
  const [stats, setStats] = useState({ employees: 0, tasks: 0, meetings: 0, messages: 0, reminders: 0, completed: 0, total: 0 });
  const [birthdays, setBirthdays] = useState<any[]>([]);
  const [pendingTasksList, setPendingTasksList] = useState<Task[]>([]);
  const [upcomingMeetingsList, setUpcomingMeetingsList] = useState<AgendaEvent[]>([]);
  const [upcomingRemindersList, setUpcomingRemindersList] = useState<AgendaEvent[]>([]);
  const [teamMembersList, setTeamMembersList] = useState<User[]>([]);
  
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [bdays, empsData, allTasks, allEvents, mailData] = await Promise.all([
        api("/api/birthdays"),
        api("/api/admin/employees").catch(() => api("/api/employees")),
        api("/api/tasks").catch(() => []),
        api("/api/agenda").catch(() => []),
        api("/api/mail?tab=inbox").catch(() => [])
      ]);

      setBirthdays(bdays.slice(0, 5));
      setTeamMembersList(empsData.slice(0, 4));

      const pending = allTasks.filter((t: Task) => t.status === "pending" || t.status === "inProgress");
      const completed = allTasks.filter((t: Task) => t.status === "completed");
      setPendingTasksList(pending);

      const meetings = allEvents.filter((e: AgendaEvent) => e.event_type === "reuniao");
      setUpcomingMeetingsList(meetings);

      const reminders = allEvents.filter((e: AgendaEvent) => e.event_type === "lembrete");
      setUpcomingRemindersList(reminders);

      setStats({
        employees: empsData.length,
        tasks: pending.length,
        meetings: meetings.length,
        messages: mailData.filter((m: any) => !m.is_read).length,
        reminders: reminders.length,
        completed: completed.length,
        total: allTasks.length
      });
    } catch (error) {
      console.error("Dashboard load error", error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(() => fetchDashboardData(true), 30000);
    return () => clearInterval(interval);
  }, []);

  const progressPercentage = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  if (loading) {
     return (
        <div className="h-[60vh] flex items-center justify-center">
           <Loader2 className="w-8 h-8 animate-spin text-primary opacity-50" />
        </div>
     );
  }

  return (
    <div className="space-y-10 pb-20">
      {/* Header with Title and Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
         <motion.div {...fadeIn(0)}>
            <h1 className="text-4xl font-black text-foreground tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground font-medium mt-2">Planeje, priorize e complete suas tarefas com facilidade. 👋</p>
         </motion.div>
         
         <motion.div {...fadeIn(0.1)} className="flex items-center gap-3">
            <button className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
               <Plus className="w-4 h-4" />
               Adicionar Tarefa
            </button>
         </motion.div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
         <DonezoStatCard 
            label="Total de Tarefas" 
            value={stats.total.toString()} 
            trend="+12%" 
            delay={0.15} 
            primary 
            icon={TrendingUp}
         />
         <DonezoStatCard 
            label="Concluídas" 
            value={stats.completed.toString()} 
            trend="+05" 
            delay={0.2} 
            icon={CheckCircle2}
         />
         <DonezoStatCard 
            label="Em Andamento" 
            value={stats.tasks.toString()} 
            trend="12" 
            delay={0.25} 
            icon={Clock}
         />
         <DonezoStatCard 
            label="Pendentes" 
            value={stats.tasks.toString()} 
            trend="02" 
            delay={0.3} 
            icon={AlertCircle}
         />
      </div>

      {/* Middle Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
         {/* Analytics Visual Chart Placeholder (Styling as in image) */}
         <motion.div {...fadeIn(0.35)} className="bg-card rounded-[1.25rem] border border-border p-8 h-full">
            <div className="flex items-center justify-between mb-8">
               <h2 className="text-xl font-black text-foreground">Distribuição Semanal</h2>
               <MoreVertical className="w-5 h-5 text-muted-foreground cursor-pointer" />
            </div>
            
            <div className="flex items-end justify-between h-48 gap-4 px-2">
               {[
                  { d: "S", v: "40%", h: "40%" },
                  { d: "M", v: "80%", h: "80%" },
                  { d: "T", v: "60%", h: "60%", active: true },
                  { d: "W", v: "95%", h: "95%" },
                  { d: "T", v: "30%", h: "30%", pattern: true },
                  { d: "F", v: "55%", h: "55%", pattern: true },
                  { d: "S", v: "20%", h: "20%", pattern: true }
               ].map((bar, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                     <div className="w-full relative flex flex-col justify-end h-40">
                        {bar.active && (
                           <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-bold px-2 py-1 rounded-lg">
                              {bar.v}
                           </div>
                        )}
                        <div 
                           className={cn(
                              "w-full rounded-full transition-all duration-700 ease-out h-[0%]",
                              bar.active ? "bg-primary" : "bg-primary/20 group-hover:bg-primary/30",
                              bar.pattern && "bg-transparent border-2 border-primary/20 border-dashed"
                           )}
                           style={{ height: bar.h }}
                        />
                     </div>
                     <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors">{bar.d}</span>
                  </div>
               ))}
            </div>
         </motion.div>

         {/* Floating Activity Tracker Style (Moved Up) */}
         <motion.div {...fadeIn(0.55)} className="bg-primary rounded-[1.25rem] border border-primary p-8 text-primary-foreground relative overflow-hidden group h-full">
            <div className="relative z-10 flex flex-col h-full">
               <h3 className="text-xl font-bold opacity-80">Rastreador Local</h3>
               
               <div className="flex-1 flex flex-col items-center justify-center py-6">
                  <div className="text-4xl font-black tracking-tighter mb-4 animate-pulse">02:24:08</div>
                  <div className="flex gap-4">
                     <button className="w-12 h-12 bg-white text-primary rounded-xl flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all outline-none">
                        <X className="w-6 h-6 fill-current" />
                     </button>
                     <button className="w-12 h-12 bg-white/20 text-white rounded-xl flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all outline-none">
                        <Calendar className="w-5 h-5 fill-current" />
                     </button>
                  </div>
               </div>

               <div className="mt-auto pt-6 border-t border-white/20">
                  <div className="flex items-center justify-between">
                     <div className="flex flex-col">
                        <span className="text-[10px] font-black opacity-60 uppercase tracking-widest">Equipe Atual</span>
                        <span className="text-sm font-bold">Administração Sede</span>
                     </div>
                     <ArrowUpRight className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </div>
               </div>
            </div>

            {/* Visual background waves */}
            <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-white/5 blur-3xl rounded-full" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 to-transparent opacity-50" />
         </motion.div>

         {/* Reminders Card */}
         <motion.div {...fadeIn(0.4)} className="bg-card rounded-[1.25rem] border border-border p-8 h-full">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-xl font-black text-foreground">Lembretes</h3>
               <button className="text-[10px] font-black text-primary border border-primary/20 px-3 py-1 rounded-full uppercase tracking-widest hover:bg-primary hover:text-white transition-all">Novo</button>
            </div>
            
            <div className="space-y-6">
               {(upcomingRemindersList.length > 0 ? upcomingRemindersList.slice(0, 4) : [
                  { title: "Nenum lembrete hoje", description: "Tudo em ordem!" }
               ]).map((rem, i) => (
                  <div key={i} className="flex flex-col">
                     <h4 className="font-bold text-sm text-foreground leading-tight">{rem.title}</h4>
                     <p className="text-xs text-muted-foreground font-medium mt-1">Horário: {rem.event_time || "--:--"}</p>
                  </div>
               ))}

               <button className="w-full mt-6 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-4 rounded-2xl font-black text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                  <Play className="w-4 h-4 fill-current" />
                  Iniciar Reunião
               </button>
            </div>
         </motion.div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Team Collaboration */}
         <motion.div {...fadeIn(0.45)} className="bg-card rounded-[1.25rem] border border-border p-8">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-xl font-black text-foreground">Colaboração</h3>
               <div className="p-2 border border-border rounded-xl cursor-pointer hover:bg-muted">
                  <Plus className="w-4 h-4 text-muted-foreground" />
               </div>
            </div>
            
            <div className="space-y-6">
               {teamMembersList.map((tm, i) => (
                  <div key={i} className="flex items-center gap-4 group">
                     <div className="w-12 h-12 rounded-xl bg-muted border-2 border-background shadow-sm overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-300">
                        {tm.avatar_url ? (
                           <img src={`http://${window.location.hostname}:3001${tm.avatar_url}`} className="w-full h-full object-cover" />
                        ) : (
                           <div className="w-full h-full gradient-brand flex items-center justify-center text-primary-foreground font-bold text-sm">
                              {tm.name[0].toUpperCase()}
                           </div>
                        )}
                     </div>
                     <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground leading-none">{tm.name}</p>
                        <p className="text-[10px] text-muted-foreground font-medium mt-1 truncate">{tm.team_name || "Membro da Equipe"}</p>
                     </div>
                     <div className={cn(
                        "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                        i % 2 === 0 ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                     )}>
                        {i % 2 === 0 ? "Ativo" : "Ocupado"}
                     </div>
                  </div>
               ))}
            </div>
         </motion.div>

         {/* Project Progress Circular */}
         <motion.div {...fadeIn(0.5)} className="bg-card rounded-[1.25rem] border border-border p-8 flex flex-col items-center justify-center relative overflow-hidden">
            <h3 className="text-xl font-black text-foreground self-start mb-4">Progresso Geral</h3>
            
            <div className="relative w-48 h-48 flex items-center justify-center mt-4">
               {/* Simplified SVGs for circular progress */}
               <svg className="w-full h-full -rotate-90">
                  <circle 
                     cx="96" cy="96" r="80" 
                     className="stroke-muted fill-none stroke-[16]"
                  />
                  <circle 
                     cx="96" cy="96" r="80" 
                     className="stroke-primary fill-none stroke-[16] transition-all duration-1000 ease-out"
                     strokeDasharray={502.6}
                     strokeDashoffset={502.6 * (1 - progressPercentage / 100)}
                     strokeLinecap="round"
                  />
               </svg>
               <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black text-foreground">{progressPercentage}%</span>
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Finalizado</span>
               </div>
            </div>

            <div className="flex gap-4 mt-10">
               <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                  <span className="text-[10px] font-bold text-muted-foreground">Concluídas</span>
               </div>
               <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary/20" />
                  <span className="text-[10px] font-bold text-muted-foreground">Pendente</span>
               </div>
            </div>
         </motion.div>
      </div>

       {/* Download Section Placeholder */}
       <motion.div {...fadeIn(0.6)} className="bg-card border border-border rounded-[1.25rem] p-10 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
          <div className="relative z-10">
             <h2 className="text-3xl font-black text-foreground tracking-tight">Leve o Organizer para qualquer lugar</h2>
             <p className="text-muted-foreground mt-2 max-w-lg">Baixe nosso aplicativo mobile para gerenciar suas tarefas e equipe em tempo real, onde quer que você esteja.</p>
             <button className="mt-8 flex items-center gap-3 bg-foreground text-background px-8 py-4 rounded-xl font-black text-sm hover:opacity-90 transition-all shadow-xl shadow-foreground/10">
                <Download className="w-5 h-5" />
                Baixar Aplicativo
             </button>
          </div>
          
          <div className="relative z-10 w-full max-w-[300px] h-40 bg-gradient-to-br from-primary to-accent rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center">
             <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center mb-2 shadow-lg scale-110 p-1">
                   <img src="/logo-anteffa.png" alt="Logo" className="w-full h-full object-contain" />
                </div>
                <div className="text-white text-[10px] font-black uppercase tracking-widest opacity-80">Anteffa Adm</div>
             </div>
          </div>

          <div className="absolute top-0 right-0 w-[50%] h-full bg-primary/5 -skew-x-12 translate-x-20 pointer-events-none" />
       </motion.div>
    </div>
  );
}
