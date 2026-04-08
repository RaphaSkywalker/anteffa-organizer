import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Clock, 
  MapPin, 
  History, 
  Calendar as CalendarIcon, 
  ArrowRight, 
  CheckCircle2, 
  Lock, 
  Edit3, 
  AlertCircle,
  Map as MapIcon,
  Navigation,
  Loader2,
  Trash2,
  Pointer,
  Check,
  ChevronLeft,
  ChevronRight,
  FileDown,
  Printer,
  FileText
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn, safeDate } from "@/lib/utils";

interface TimeLog {
  id: number;
  punch_type: string;
  punch_time: string;
  punch_date: string;
  latitude: number;
  longitude: number;
  location_category: string;
  is_finalized: number;
}

const HQ_COORDS = { lat: -15.7891001, lng: -47.8875931 };

const PUNCH_TYPES = [
  { id: 'entrada', label: 'Entrada', icon: Clock, color: 'text-blue-500' },
  { id: 'almoco_saida', label: 'Saída Almoço', icon: Navigation, color: 'text-orange-500' },
  { id: 'almoco_retorno', label: 'Retorno Almoço', icon: Clock, color: 'text-green-500' },
  { id: 'saida', label: 'Saída', icon: Navigation, color: 'text-red-500' },
];

const PUNCH_ORDER: Record<string, number> = {
  'entrada': 1,
  'almoco_saida': 2,
  'almoco_retorno': 3,
  'saida': 4
};

// Haversine formula to get distance in KM
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Isolated Digital Clock Component to prevent page-wide flickering
function DigitalClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="text-center">
      <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-[0.3em] mb-4">Horário de Brasília</p>
      <div className="text-5xl sm:text-6xl lg:text-6xl font-black text-foreground tracking-normal tabular-nums mb-2">
        {time.toLocaleTimeString('pt-BR', { hour12: false })}
      </div>
      <p className="text-primary font-bold text-[10px] sm:text-sm tracking-widest uppercase">
        {time.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
      </p>
    </div>
  );
}

// Subcomponent for daily logs list
const DailyLogsList = ({ 
  logs, 
  isFinalized, 
  onFinalize, 
  onEdit, 
  onDelete,
  compact = false 
}: { 
  logs: TimeLog[], 
  isFinalized: boolean, 
  onFinalize: () => void,
  onEdit: (log: TimeLog) => void,
  onDelete: (id: number) => void,
  compact?: boolean 
}) => {
  // Sort logs by PUNCH_ORDER
  const sortedLogs = [...logs].sort((a, b) => {
    const orderA = PUNCH_ORDER[a.punch_type] || 99;
    const orderB = PUNCH_ORDER[b.punch_type] || 99;
    return orderA - orderB;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-border/50">
         <h2 className="text-xl font-black text-foreground flex items-center gap-2">
            <History className="w-6 h-6 text-primary" /> Registros de Hoje
         </h2>
         {isFinalized && (
           <div className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 text-xs font-black uppercase tracking-widest">
              <Lock className="w-4 h-4" /> Fechado
           </div>
         )}
      </div>

      <div className="grid gap-3">
        <AnimatePresence mode="popLayout">
          {sortedLogs.length === 0 ? (
            <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={cn("py-20 text-center glass-card border-dashed border-2 border-border/60 rounded-[2rem]", compact && "py-10")}>
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                 <Clock className="w-8 h-8 text-muted-foreground opacity-30" />
              </div>
              <p className="text-muted-foreground text-sm font-bold italic">Nenhum registro ainda hoje.</p>
            </motion.div>
          ) : (
            sortedLogs.map((log) => (
              <motion.div 
                key={log.id} 
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                  "glass-card group flex items-center justify-between p-5 rounded-3xl border border-border/50 hover:border-primary/30 transition-all shadow-sm relative overflow-hidden",
                  compact && "p-4"
                )}
              >
                <div className={cn(
                  "absolute top-0 left-0 w-1.5 h-full",
                  log.punch_type === 'entrada' ? 'bg-green-500' : 
                  log.punch_type === 'saida' ? 'bg-red-500' : 
                  'bg-blue-500'
                )} />
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-muted flex flex-col items-center justify-center leading-none">
                     <span className="text-lg font-black text-foreground">{log.punch_time.split(':')[0]}</span>
                     <span className="text-[8px] font-bold text-muted-foreground uppercase">{log.punch_time.split(':')[1]} min</span>
                  </div>
                  <div>
                    <p className="text-xs font-black text-foreground uppercase tracking-widest">
                      {PUNCH_TYPES.find(t => t.id === log.punch_type)?.label || log.punch_type}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground uppercase">
                        <MapIcon className="w-2.5 h-2.5" /> {log.location_category}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!isFinalized && (
                    <>
                      <button 
                        onClick={() => onEdit(log)}
                        className="p-2 rounded-lg bg-muted text-muted-foreground hover:text-primary transition-colors hover:bg-primary/10"
                        title="Editar"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onDelete(log.id)}
                        className="p-2 rounded-lg bg-muted text-muted-foreground hover:text-destructive transition-colors hover:bg-destructive/10"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  {isFinalized && <Check className="w-5 h-5 text-green-500" />}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {!isFinalized && logs.length > 0 && (
         <div className="flex justify-end pt-2">
           <button 
            onClick={onFinalize}
            className="px-6 py-3 rounded-2xl bg-primary text-primary-foreground text-xs font-black uppercase tracking-widest hover:brightness-110 active:scale-95 shadow-xl shadow-primary/20 transition-all flex items-center gap-2"
           >
             <CheckCircle2 className="w-4 h-4" /> Finalizar Dia
           </button>
         </div>
      )}
    </div>
  );
};

const MonthlyPunchChart = ({ data, loading, date, onPrev, onNext }: any) => {
  const monthName = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="glass-card p-8 rounded-[2.5rem] border border-border/50 shadow-xl bg-card h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
         <h3 className="text-lg font-black text-foreground flex items-center gap-2">
            <Navigation className="w-5 h-5 text-primary rotate-45" /> Gráfico de Ponto Diário
         </h3>
         <div className="flex items-center gap-3 bg-muted/40 p-1 rounded-xl border border-border">
            <button onClick={onPrev} className="p-1.5 hover:bg-background rounded-lg transition-all active:scale-90"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground w-28 text-center">{monthName}</span>
            <button onClick={onNext} className="p-1.5 hover:bg-background rounded-lg transition-all active:scale-90"><ChevronRight className="w-4 h-4" /></button>
         </div>
      </div>

      <div className="flex-1 min-h-[220px] w-full">
        {loading ? (
          <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary opacity-20" /></div>
        ) : data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[10px] font-bold text-muted-foreground italic uppercase flex-col gap-2">
            <History className="w-8 h-8 opacity-10" />
            Nenhum dado este mês
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
              <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 9, fill: 'currentColor', opacity: 0.5 }} 
                interval={Math.floor(data.length / 10)}
              />
              <YAxis hide domain={[0, 'auto']} />
              <Tooltip 
                cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '5 5' }}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  borderColor: 'rgba(255,255,255,0.1)',
                  borderRadius: '1rem',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)'
                }}
                itemStyle={{ color: 'hsl(var(--primary))' }}
                formatter={(value: any) => [`${value}h`, 'Jornada']}
                labelFormatter={(label) => `Dia ${label}`}
              />
              <Area 
                type="monotone" 
                dataKey="hours" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorHours)" 
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default function PontoPage() {
  const { api, user } = useAuth();
  const [logs, setLogs] = useState<TimeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [punching, setPunching] = useState(false);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locCategory, setLocCategory] = useState<string>("Detectando...");
  const [selectedPunchType, setSelectedPunchType] = useState('entrada');
  const [statsTrigger, setStatsTrigger] = useState(0);
  const [reportOpen, setReportOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<TimeLog | null>(null);
  const [editTime, setEditTime] = useState("");
  const [monthlyFullData, setMonthlyFullData] = useState<any[]>([]);
  const [chartDate, setChartDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [statsLoading, setStatsLoading] = useState(false);

  const totalWorkedMonth = monthlyFullData.reduce((acc, curr) => acc + curr.hours, 0);
  const PREVISTO_MES = 176; // Valor de referência solicitado pelo usuário
  const saldoMes = totalWorkedMonth - PREVISTO_MES;

  const fetchMonthlyData = async () => {
    try {
      setStatsLoading(true);
      const month = (chartDate.getMonth() + 1).toString().padStart(2, '0');
      const year = chartDate.getFullYear().toString();
      const stats = await api(`/api/time-logs/stats?month=${month}&year=${year}`);
      setMonthlyFullData(stats || []);
    } catch (e) {
      console.error(e);
    } finally {
      setStatsLoading(false);
    }
  };

  const refreshAll = () => {
    fetchLogs();
    fetchMonthlyData();
    setStatsTrigger(prev => prev + 1);
  };

  const fetchLogs = async () => {
    try {
      const today = new Intl.DateTimeFormat('fr-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
      const data = await api(`/api/time-logs?date=${today}`);
      setLogs(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getPosition = () => {
    if (!navigator.geolocation) {
      setLocCategory("GPS não suportado");
      return;
    }
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      setLocation({ lat: latitude, lng: longitude });
      const distance = getDistance(latitude, longitude, HQ_COORDS.lat, HQ_COORDS.lng);
      if (distance <= 1.0) setLocCategory("ANTEFFA");
      else setLocCategory("Remoto / Deslocamento");
    }, (err) => {
      setLocCategory("GPS Desativado");
    });
  };

  useEffect(() => {
    fetchLogs();
    getPosition();
  }, []);

  useEffect(() => {
    fetchMonthlyData();
  }, [chartDate]);

  const handlePunch = async () => {
    if (!location) {
      toast.error("Aguardando localização GPS...");
      getPosition();
      return;
    }
    try {
      setPunching(true);
      const now = new Date();
      const today = new Intl.DateTimeFormat('fr-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
      const payload = {
        punch_type: selectedPunchType,
        punch_time: now.toLocaleTimeString('pt-BR', { hour12: false }),
        punch_date: today,
        latitude: location.lat,
        longitude: location.lng,
        location_category: locCategory
      };
      await api('/api/time-logs', { method: 'POST', body: JSON.stringify(payload) });
      toast.success("Ponto registrado com sucesso!");
      refreshAll();
    } catch (e: any) {
      toast.error(e.message || "Erro ao registrar ponto");
    } finally {
      setPunching(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este registro?")) return;
    try {
      await api(`/api/time-logs/${id}`, { method: 'DELETE' });
      toast.success("Registro excluído!");
      refreshAll();
    } catch (e: any) {
      toast.error(e.message || "Erro ao excluir registro");
    }
  };

  const handleEdit = (log: TimeLog) => {
    setEditingLog(log);
    setEditTime(log.punch_time.substring(0, 5));
  };

  const handleSaveEdit = async () => {
    if (!editingLog) return;
    
    if (!/^\d{2}:\d{2}$/.test(editTime)) {
      toast.error("Formato inválido. Use HH:mm");
      return;
    }

    try {
      await api(`/api/time-logs/${editingLog.id}`, { 
        method: 'PUT', 
        body: JSON.stringify({ punch_time: editTime + ":00" }) 
      });
      toast.success("Horário atualizado!");
      setEditingLog(null);
      refreshAll();
    } catch (e: any) {
      toast.error(e.message || "Erro ao atualizar registro");
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "").substring(0, 4);
    if (val.length >= 3) {
      val = val.substring(0, 2) + ":" + val.substring(2);
    }
    setEditTime(val);
  };

  const handleFinalize = async () => {
    if (logs.length === 0) return;
    try {
      const today = new Intl.DateTimeFormat('fr-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
      await api('/api/time-logs/finalize', { method: 'POST', body: JSON.stringify({ date: today }) });
      toast.success("Jornada finalizada! Registros bloqueados.");
      refreshAll();
    } catch (e: any) {
      toast.error("Erro ao finalizar jornada");
    }
  };

  const isFinalized = logs.length > 0 && !!logs[0].is_finalized;
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Standard Header Style */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
         <motion.div {...fadeIn} className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
                <Clock className="w-6 h-6 text-primary" />
            </div>
            <div>
                <h1 className="text-2xl font-bold text-foreground tracking-tight">Meu Ponto</h1>
                <p className="text-xs text-muted-foreground mt-0.5 italic">Gerencie sua jornada com precisão, segurança e geolocalização. ✅</p>
            </div>
         </motion.div>
         
         <div className="hidden lg:flex items-center gap-4">
            <div className="px-5 py-3 rounded-2xl bg-card border border-border shadow-sm flex items-center gap-4 transition-all hover:border-primary/30">
               <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-primary" />
               </div>
               <div>
                 <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">Localização Atual</p>
                 <p className="text-xs font-black text-foreground">{locCategory}</p>
               </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <motion.div {...fadeIn} className="lg:col-span-12 relative overflow-hidden rounded-[2.5rem] bg-card/30 border border-border/50 shadow-2xl backdrop-blur-xl">
           <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[100px] -mr-48 -mt-48" />
           <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/10 rounded-full blur-[100px] -ml-32 -mb-32" />

           <div className="relative flex flex-col lg:flex-row gap-8 lg:gap-0">
             <div className="flex-1 p-8 lg:p-12 hidden lg:block">
                <DailyLogsList 
                  logs={logs} 
                  isFinalized={!!isFinalized} 
                  onFinalize={handleFinalize}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  compact 
                />
             </div>

             <div className="w-full lg:w-[450px] p-6 sm:p-8 lg:p-12 lg:border-l border-border/50 bg-background/40">
                <div className="glass-card p-6 sm:p-10 rounded-[2.5rem] text-center border border-primary/20 shadow-primary/10 shadow-2xl bg-card">
                  <DigitalClock />

                  <div className="grid grid-cols-2 gap-3 mt-10">
                    {PUNCH_TYPES.map(type => (
                      <button
                        key={type.id}
                        disabled={!!isFinalized}
                        onClick={() => setSelectedPunchType(type.id)}
                        className={cn(
                          "flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all active:scale-95 disabled:opacity-50",
                          selectedPunchType === type.id 
                            ? "bg-primary border-primary shadow-lg shadow-primary/20 text-primary-foreground" 
                            : "bg-background border-border hover:border-primary/40 text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <type.icon className={cn("w-4 h-4", selectedPunchType === type.id ? "text-white" : type.color)} />
                        <span className="text-[9px] font-bold uppercase">{type.label}</span>
                      </button>
                    ))}
                  </div>

                  <button 
                    onClick={handlePunch}
                    disabled={punching || !!isFinalized}
                    className="w-full h-20 mt-6 rounded-[1.5rem] bg-primary text-primary-foreground text-xl font-black shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 group overflow-hidden relative"
                  >
                    {punching ? <Loader2 className="w-8 h-8 animate-spin" /> : !!isFinalized ? <Lock className="w-8 h-8" /> : <Pointer className="w-8 h-8 group-hover:rotate-12 transition-transform" />}
                    {!!isFinalized ? "Finalizado" : "BATER PONTO"}
                  </button>
                </div>
                
                <div className="flex lg:hidden flex-wrap items-center justify-center gap-4 mt-8">
                  <div className="px-6 py-4 rounded-3xl bg-card border border-border shadow-xl flex items-center gap-3 w-full">
                      <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">Localização Atual</p>
                        <p className="text-sm font-black text-foreground">{locCategory}</p>
                      </div>
                  </div>
                </div>
             </div>
           </div>
        </motion.div>

        <div className="lg:col-span-12 lg:hidden">
            <DailyLogsList 
              logs={logs} 
              isFinalized={isFinalized} 
              onFinalize={handleFinalize}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
        </div>

        {/* Analytic Section - Full Width on Large, Side by Side */}
        <motion.div {...fadeIn} className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 glass-card p-8 rounded-[2.5rem] border border-border/50 shadow-xl bg-card">
               <h3 className="text-lg font-black text-foreground flex items-center gap-2 mb-6">
                  <CalendarIcon className="w-5 h-5 text-primary" /> Espelho Mensal
               </h3>
               
               <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-muted/40 border border-border">
                     <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Carga Horária (Mês)</p>
                     <div className="flex items-end gap-2">
                        <p className="text-3xl font-black text-foreground leading-none">{totalWorkedMonth.toFixed(1)}h</p>
                        <p className="text-xs font-bold text-green-500 pb-1">/ {PREVISTO_MES}h</p>
                     </div>
                  </div>
                  
                  <div className="p-5 rounded-2xl bg-muted/40 border border-border">
                     <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Saldo de Horas</p>
                     <p className={cn(
                       "text-3xl font-black leading-none",
                       saldoMes >= 0 ? "text-green-500" : "text-red-500"
                     )}>
                       {saldoMes >= 0 ? '+' : ''}{saldoMes.toFixed(1)}h
                     </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-muted/40 border border-border opacity-50">
                     <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Status de Assinatura</p>
                     <div className="flex items-center gap-2 text-yellow-600">
                        <AlertCircle className="w-4 h-4" />
                        <p className="text-xs font-bold uppercase italic text-[9px]">Aguardando Fechamento</p>
                     </div>
                  </div>
               </div>

               <button 
                  onClick={() => setReportOpen(true)}
                  className="w-full mt-6 py-4 rounded-xl bg-background border border-border text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-muted hover:text-foreground transition-all flex items-center justify-center gap-2"
               >
                  Ver Relatório Completo <ArrowRight className="w-4 h-4" />
               </button>
            </div>

            <div className="lg:col-span-2">
               <MonthlyPunchChart 
                  data={monthlyFullData} 
                  loading={statsLoading} 
                  date={chartDate}
                  onNext={() => {
                    const next = new Date(chartDate);
                    next.setMonth(next.getMonth() + 1);
                    setChartDate(next);
                  }}
                  onPrev={() => {
                    const prev = new Date(chartDate);
                    prev.setMonth(prev.getMonth() - 1);
                    setChartDate(prev);
                  }}
               />
            </div>
        </motion.div>

        <motion.div {...fadeIn} className="lg:col-span-12 glass-card p-8 rounded-[2rem] border border-border/50 bg-primary/5">
            <p className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-3">Dica de Segurança</p>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Lembre-se de sempre bater o ponto através da rede Wi-Fi da empresa para que sua localização seja identificada automaticamente.
            </p>
        </motion.div>
      </div>

      <ReportModal 
        open={reportOpen} 
        onOpenChange={setReportOpen}
        user={user}
        todayLogs={logs}
        monthlyStats={monthlyFullData}
        selectedDate={chartDate}
      />

      <EditTimeDialog 
        log={editingLog} 
        value={editTime}
        onOpenChange={() => setEditingLog(null)}
        onChange={handleTimeChange}
        onSave={handleSaveEdit}
      />
    </div>
  );
}

const EditTimeDialog = ({ log, value, onOpenChange, onChange, onSave }: any) => {
  if (!log) return null;

  return (
    <Dialog open={!!log} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden glass-card border-border/50">
        <DialogHeader className="p-8 pb-4">
          <DialogTitle className="text-xl font-black flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-primary" /> Ajustar Horário
          </DialogTitle>
          <DialogDescription className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
            Corrija o registro de {PUNCH_TYPES.find(t => t.id === log.punch_type)?.label || log.punch_type}
          </DialogDescription>
        </DialogHeader>

        <div className="p-8 pt-0 space-y-6">
          <div className="space-y-3">
             <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Horário da Batida</Label>
             <div className="relative">
                <Input 
                  value={value}
                  onChange={onChange}
                  placeholder="00:00"
                  className="h-16 text-2xl font-black text-center tracking-widest bg-muted/20 border-border/50 focus:border-primary/50"
                  maxLength={5}
                />
                <Clock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground opacity-30" />
             </div>
             <p className="text-[9px] text-center text-muted-foreground font-bold italic">Formato aceito: 24 horas (ex: 13:45)</p>
          </div>

          <div className="flex gap-3">
             <button 
               onClick={onOpenChange}
               className="flex-1 py-4 rounded-xl border border-border text-[10px] font-black uppercase tracking-widest hover:bg-muted transition-all"
             >
               Cancelar
             </button>
             <button 
               onClick={onSave}
               className="flex-1 py-4 rounded-xl bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:brightness-110 active:scale-95 transition-all"
             >
               Salvar Alterações
             </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ReportModal = ({ open, onOpenChange, user, todayLogs, monthlyStats, selectedDate }: any) => {
  const [gpdLogo, setGpdLogo] = useState<string | null>(null);
  const [footerLogo, setFooterLogo] = useState<string | null>(null);
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      const fetchAsset = async (url: string, callback: (res: string) => void) => {
        try {
          // Use absolute path to avoid potential fetch issues in some browser/env configs
          const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
          const response = await fetch(fullUrl);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const blob = await response.blob();
          const reader = new FileReader();
          reader.onloadend = () => callback(reader.result as string);
          reader.readAsDataURL(blob);
        } catch (e) {
          console.error(`[PDF Asset Error] Falha ao carregar: ${url}`, e);
        }
      };

      fetchAsset('/logo-gpd.jpg', setGpdLogo);
      fetchAsset('/logo-anteffa-footer.png', setFooterLogo);
      
      if (user?.avatar_url) {
        fetchAsset(user.avatar_url.startsWith('http') ? user.avatar_url : `http://${window.location.hostname}:3001${user.avatar_url}`, setAvatarBase64);
      } else {
        fetchAsset(`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=random&size=128`, setAvatarBase64);
      }
    }
  }, [open, user]);

  const exportPDF = (type: 'daily' | 'monthly') => {
    const doc = new jsPDF();
    const titleText = type === 'daily' ? 'Folha de Ponto Diária' : 'Folha de Ponto Mensal';
    const userLogin = (user?.name || 'usuario').split(' ')[0].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // First name sanitized
    const dateFormatted = selectedDate.toISOString().split('T')[0];
    const period = type === 'daily' ? 'dia' : 'mes';
    const filename = `${userLogin}_ponto_${period}_${dateFormatted}.pdf`;

    // 1. Header: Avatar & Info (LEFT) - ALIGNED WITH LOGO
    if (avatarBase64) {
      try {
        // Draw image frame
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.5);
        doc.rect(14, 12, 20, 20, 'S');
        doc.addImage(avatarBase64, 'JPEG', 14.5, 12.5, 19, 19);
      } catch (e) { 
        console.error("PDF Profile Image Error:", e); 
      }
    }

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text(user?.name || 'Colaborador', 38, 19);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(user?.team_name || 'Equipe não informada', 38, 24);

    // 2. Header: Logo ANTEFFA (RIGHT) - Reduced by 20% per request
    if (footerLogo) {
      doc.addImage(footerLogo, 'PNG', 163, 12, 32, 0);
    }

    // 3. Document Title
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text(titleText, 105, 50, { align: 'center' });

    // 4. Metrics Configuration (DAILY)
    const cardsStartY = 58;
    const cardsStartX = 14;
    const cardWidth = 60;
    const cardHeight = 18;

    const tableData = type === 'daily' 
      ? [[
          `${new Date().getDate()}/${(selectedDate.getMonth()+1).toString().padStart(2, '0')} (${new Date().toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')})`,
          '08:00 - 18:00',
          todayLogs.find((l: any) => l.punch_type === 'entrada')?.punch_time.substring(0, 5) || '--:--',
          todayLogs.find((l: any) => l.punch_type === 'almoco_saida')?.punch_time.substring(0, 5) || '--:--',
          todayLogs.find((l: any) => l.punch_type === 'almoco_retorno')?.punch_time.substring(0, 5) || '--:--',
          todayLogs.find((l: any) => l.punch_type === 'saida')?.punch_time.substring(0, 5) || '--:--',
          'Calculando...'
        ]]
      : monthlyStats.map((s: any) => {
          const dateObj = new Date(s.date + 'T12:00:00'); // Midday to avoid TZ issues
          const dayName = dateObj.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
          return [
            `${s.day}/${(selectedDate.getMonth()+1).toString().padStart(2, '0')} (${dayName})`,
            '08:00 - 18:00',
            s.punches?.entrada || '--:--',
            s.punches?.almoco_saida || '--:--',
            s.punches?.almoco_retorno || '--:--',
            s.punches?.saida || '--:--',
            `${s.hours}h`
          ];
        });

    // For daily, we need a simple calculation of today's total
    if (type === 'daily') {
        const timeToMin = (t: string) => {
            if (!t || t === '--:--') return 0;
            const [h, m] = t.split(':').map(Number);
            return h * 60 + m;
        };
        const ent1 = timeToMin(todayLogs.find((l: any) => l.punch_type === 'entrada')?.punch_time || '');
        const sai1 = timeToMin(todayLogs.find((l: any) => l.punch_type === 'almoco_saida')?.punch_time || '');
        const ent2 = timeToMin(todayLogs.find((l: any) => l.punch_type === 'almoco_retorno')?.punch_time || '');
        const sai2 = timeToMin(todayLogs.find((l: any) => l.punch_type === 'saida')?.punch_time || '');
        
        let totalToday = 0;
        if (ent1 && sai1) totalToday += (sai1 - ent1);
        if (ent2 && sai2) totalToday += (sai2 - ent2);
        const totalHours = (totalToday / 60).toFixed(1);
        tableData[0][6] = `${totalHours}h`;

        const totalHoursNum = parseFloat(totalHours);
        const dailyTarget = 8.0;
        const saldo = totalHoursNum - dailyTarget;

        // Metric 1: Total Hoje (Gray)
        doc.setFillColor(240, 240, 240);
        doc.roundedRect(cardsStartX, cardsStartY, cardWidth, cardHeight, 2, 2, 'F');
        doc.setFontSize(7); doc.setTextColor(100); doc.text("Total Hoje", cardsStartX + 5, cardsStartY + 6);
        doc.setFontSize(11); doc.setTextColor(0); doc.text(`${totalHours}h`, cardsStartX + 5, cardsStartY + 13);

        // Metric 2: Previsto Dia (Gray)
        doc.setFillColor(240, 240, 240);
        doc.roundedRect(cardsStartX + cardWidth + 3, cardsStartY, cardWidth, cardHeight, 2, 2, 'F');
        doc.setFontSize(7); doc.setTextColor(100); doc.text("Previsto Dia", cardsStartX + cardWidth + 8, cardsStartY + 6);
        doc.setFontSize(11); doc.setTextColor(0); doc.text(`8.0h`, cardsStartX + cardWidth + 8, cardsStartY + 13);

        // Metric 3: Saldo Dia (Dynamic)
        let fillColor = [230, 230, 255]; // Blue (Default positive)
        let textColor = [30, 30, 150];
        if (saldo < 0) { fillColor = [255, 230, 230]; textColor = [150, 30, 30]; }
        else if (saldo === 0) { fillColor = [230, 255, 230]; textColor = [30, 150, 30]; }

        doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
        doc.roundedRect(cardsStartX + (cardWidth * 2) + 6, cardsStartY, cardWidth, cardHeight, 2, 2, 'F');
        doc.setFontSize(7); doc.setTextColor(textColor[0], textColor[1], textColor[2]); 
        doc.text("Saldo Dia", cardsStartX + (cardWidth * 2) + 11, cardsStartY + 6);
        doc.setFontSize(11); doc.text(`${saldo >= 0 ? '+' : ''}${saldo.toFixed(1)}h`, cardsStartX + (cardWidth * 2) + 11, cardsStartY + 13);

        autoTable(doc, {
            startY: 85,
            head: [['DIA', 'HORÁRIO', 'ENT. 1', 'SAI. 1', 'ENT. 2', 'SAI. 2', 'TOTAL']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [30, 41, 59], textColor: 255 },
            styles: { fontSize: 8, cellPadding: 3 },
            alternateRowStyles: { fillColor: [240, 248, 255] }
        });
    } else if (type === 'monthly') {
      const totalWorked = monthlyStats.reduce((acc: number, curr: any) => acc + curr.hours, 0);
      const totalPrevisto = 176; 
      const saldo = totalWorked - totalPrevisto;

      const tableHeaders = [['DIA', 'HORÁRIO', 'ENT. 1', 'SAI. 1', 'ENT. 2', 'SAI. 2', 'TOTAL']];

      // Metric 1: Total Trabalhado (Gray)
      doc.setFillColor(240, 240, 240);
      doc.roundedRect(cardsStartX, cardsStartY, cardWidth, cardHeight, 2, 2, 'F');
      doc.setFontSize(7); doc.setTextColor(100); doc.text("Total Trabalhado", cardsStartX + 5, cardsStartY + 6);
      doc.setFontSize(11); doc.setTextColor(0); doc.text(`${totalWorked.toFixed(1)}h`, cardsStartX + 5, cardsStartY + 13);

      // Metric 2: Total Previsto (Gray) - Explicitly setting color again
      doc.setFillColor(240, 240, 240);
      doc.roundedRect(cardsStartX + cardWidth + 3, cardsStartY, cardWidth, cardHeight, 2, 2, 'F');
      doc.setFontSize(7); doc.setTextColor(100); doc.text("Total Previsto", cardsStartX + cardWidth + 8, cardsStartY + 6);
      doc.setFontSize(11); doc.setTextColor(0); doc.text(`${totalPrevisto}h`, cardsStartX + cardWidth + 8, cardsStartY + 13);

      let fillColor = [230, 230, 255];
      let textColor = [30, 30, 150];
      if (saldo < 0) { fillColor = [255, 230, 230]; textColor = [150, 30, 30]; }
      else if (saldo === 0) { fillColor = [230, 255, 230]; textColor = [30, 150, 30]; }

      doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
      doc.roundedRect(cardsStartX + (cardWidth * 2) + 6, cardsStartY, cardWidth, cardHeight, 2, 2, 'F');
      doc.setFontSize(7); doc.setTextColor(textColor[0], textColor[1], textColor[2]); 
      doc.text("Saldo Mensal", cardsStartX + (cardWidth * 2) + 11, cardsStartY + 6);
      doc.setFontSize(11); doc.text(`${saldo >= 0 ? '+' : ''}${saldo.toFixed(1)}h`, cardsStartX + (cardWidth * 2) + 11, cardsStartY + 13);
      
      doc.setTextColor(30, 41, 59);
      autoTable(doc, {
        startY: 85,
        head: tableHeaders,
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [30, 41, 59], textColor: 255, fontSize: 8 },
        styles: { fontSize: 8, cellPadding: 3 },
        columnStyles: { 0: { fontStyle: 'bold' }, 6: { fontStyle: 'bold' } },
        alternateRowStyles: { fillColor: [240, 248, 255] }
      });
    }

    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        const pageHeight = doc.internal.pageSize.height;
        
        doc.setDrawColor(240, 240, 240);
        doc.line(14, pageHeight - 30, 196, pageHeight - 30);

        // Left Footer Logo (GPD) - Swapped per request
        if (gpdLogo) {
            doc.addImage(gpdLogo, 'JPEG', 14, pageHeight - 25, 25, 0);
        }

        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(100);
        doc.text("ADM ANTEFFA", 196, pageHeight - 23, { align: 'right' });
        doc.setFont("helvetica", "normal");
        doc.text("Gestão Digital de Ponto", 196, pageHeight - 19, { align: 'right' });
    }

    doc.save(filename);
    toast.success(`PDF ${type === 'daily' ? 'Diário' : 'Mensal'} gerado com sucesso!`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 glass-card border-border/50">
        <DialogHeader className="p-8 pb-0">
          <DialogTitle className="text-2xl font-black flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" /> Central de Relatórios
          </DialogTitle>
          <DialogDescription className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
            Visualize e exporte sua jornada de trabalho oficial
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="daily" className="flex-1 overflow-hidden flex flex-col mt-6">
          <div className="px-8 mb-4">
            <TabsList className="bg-muted/50 p-1">
              <TabsTrigger value="daily" className="px-8 font-bold">Diário</TabsTrigger>
              <TabsTrigger value="monthly" className="px-8 font-bold">Mensal</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="daily" className="flex-1 overflow-hidden px-8 pb-8">
            <div className="bg-card/50 border border-border rounded-2xl overflow-hidden flex flex-col h-full">
              <div className="p-6 border-b border-border flex justify-between items-center bg-muted/20">
                <div>
                   <h4 className="font-black text-sm uppercase tracking-tight">Grade Diária</h4>
                   <p className="text-[10px] text-muted-foreground">Consolidado das batidas de hoje</p>
                </div>
                <button onClick={() => exportPDF('daily')} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">
                  <FileDown className="w-4 h-4" /> Exportar PDF
                </button>
              </div>
              <ScrollArea className="flex-1">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-[9px] font-black">ENT. 1</TableHead>
                      <TableHead className="text-[9px] font-black">SAI. 1</TableHead>
                      <TableHead className="text-[9px] font-black">ENT. 2</TableHead>
                      <TableHead className="text-[9px] font-black">SAI. 2</TableHead>
                      <TableHead className="text-[9px] font-black text-right">TOTAL</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="hover:bg-muted/30">
                      <TableCell className="text-[10px] font-medium">
                        {todayLogs.find((l: any) => l.punch_type === 'entrada')?.punch_time.substring(0, 5) || '--:--'}
                      </TableCell>
                      <TableCell className="text-[10px] font-medium">
                        {todayLogs.find((l: any) => l.punch_type === 'almoco_saida')?.punch_time.substring(0, 5) || '--:--'}
                      </TableCell>
                      <TableCell className="text-[10px] font-medium">
                        {todayLogs.find((l: any) => l.punch_type === 'almoco_retorno')?.punch_time.substring(0, 5) || '--:--'}
                      </TableCell>
                      <TableCell className="text-[10px] font-medium">
                        {todayLogs.find((l: any) => l.punch_type === 'saida')?.punch_time.substring(0, 5) || '--:--'}
                      </TableCell>
                      <TableCell className="text-right font-black text-primary text-[10px]">
                        {(() => {
                           const timeToMin = (t: string) => {
                             if (!t) return 0;
                             const [h, m] = t.split(':').map(Number);
                             return h * 60 + m;
                           };
                           const ent1 = timeToMin(todayLogs.find((l: any) => l.punch_type === 'entrada')?.punch_time || '');
                           const sai1 = timeToMin(todayLogs.find((l: any) => l.punch_type === 'almoco_saida')?.punch_time || '');
                           const ent2 = timeToMin(todayLogs.find((l: any) => l.punch_type === 'almoco_retorno')?.punch_time || '');
                           const sai2 = timeToMin(todayLogs.find((l: any) => l.punch_type === 'saida')?.punch_time || '');
                           let tot = 0;
                           if (ent1 && sai1) tot += (sai1 - ent1);
                           if (ent2 && sai2) tot += (sai2 - ent2);
                           return (tot / 60).toFixed(1) + 'h';
                        })()}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="monthly" className="flex-1 overflow-hidden px-8 pb-8">
            <div className="bg-card/50 border border-border rounded-2xl overflow-hidden flex flex-col h-full">
              <div className="p-6 border-b border-border flex justify-between items-center bg-muted/20">
                <div>
                   <h4 className="font-black text-sm uppercase tracking-tight">Grade Mensal</h4>
                   <p className="text-[10px] text-muted-foreground">Consolidado de horas e batidas individuais</p>
                </div>
                <button onClick={() => exportPDF('monthly')} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">
                  <FileDown className="w-4 h-4" /> Exportar PDF
                </button>
              </div>
              <ScrollArea className="flex-1">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-[9px] font-black">DIA</TableHead>
                      <TableHead className="text-[9px] font-black">ENT. 1</TableHead>
                      <TableHead className="text-[9px] font-black">SAI. 1</TableHead>
                      <TableHead className="text-[9px] font-black">ENT. 2</TableHead>
                      <TableHead className="text-[9px] font-black">SAI. 2</TableHead>
                      <TableHead className="text-[9px] font-black text-right">TOTAL</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlyStats.map((stat: any, i: number) => (
                      <TableRow key={i} className="hover:bg-muted/30">
                        <TableCell className="font-bold text-[10px]">{stat.date.split('-').reverse().join('/')}</TableCell>
                        <TableCell className="text-[10px] font-medium">{stat.punches?.entrada}</TableCell>
                        <TableCell className="text-[10px] font-medium">{stat.punches?.almoco_saida}</TableCell>
                        <TableCell className="text-[10px] font-medium">{stat.punches?.almoco_retorno}</TableCell>
                        <TableCell className="text-[10px] font-medium">{stat.punches?.saida}</TableCell>
                        <TableCell className="text-right font-black text-primary text-[10px]">{stat.hours}h</TableCell>
                      </TableRow>
                    ))}
                    {monthlyStats.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-muted-foreground italic text-xs">Aguardando dados...</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
