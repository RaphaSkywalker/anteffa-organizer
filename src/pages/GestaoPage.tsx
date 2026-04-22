import { API_URL } from "../config";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, FileText, CheckCircle2, XCircle, AlertCircle, TrendingUp, TrendingDown, Users, ChevronDown, ChevronRight, PieChart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { exportEmployeePDF } from "@/lib/reportUtils";

const fadeIn = { initial: { opacity: 0, y: 12 } as const, animate: { opacity: 1, y: 0 } as const, transition: { duration: 0.4 } };

export default function GestaoPage() {
  const { api, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<any[]>([]);
  const [absences, setAbsences] = useState<any[]>([]);
  const [managementStats, setManagementStats] = useState<any>({ total_absences: 0, total_certificates: 0, total_positive_hours: 0, total_negative_hours: 0 });
  const [selectedEmployeeForReport, setSelectedEmployeeForReport] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [emps, abs] = await Promise.all([
        api("/api/admin/employees").catch(() => []),
        api("/api/admin/absences").catch(() => [])
      ]);

      setEmployees(emps || []);
      setAbsences(abs || []);

      const stats = await api(`/api/admin/management/stats?month=${(new Date().getMonth() + 1).toString().padStart(2, '0')}&year=${new Date().getFullYear()}`).catch(() => null);
      if (stats) setManagementStats(stats);
    } catch (error) {
      console.error("Erro ao carregar dados de gestão", error);
      toast.error("Erro ao conectar com o servidor");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.team_name === "Financeiro" || user?.role === "admin" || user?.team_name === "Presidência") {
      fetchData();
    }
  }, [user]);

  const handleExportEmployeePDF = async (type: 'daily' | 'monthly') => {
    if (!selectedEmployeeForReport) return;
    
    try {
      const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
      const year = new Date().getFullYear();
      const today = new Intl.DateTimeFormat('fr-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

      const [stats, logs] = await Promise.all([
        api(`/api/time-logs/stats?month=${month}&year=${year}&userId=${selectedEmployeeForReport.id}`),
        api(`/api/time-logs?date=${today}&userId=${selectedEmployeeForReport.id}`)
      ]);

      await exportEmployeePDF(type, selectedEmployeeForReport, logs || [], stats || [], new Date());
      toast.success(`Relatório de ${selectedEmployeeForReport.name} gerado!`);
    } catch (error) {
      toast.error("Erro ao gerar relatório");
    }
  };

  const handleUpdateAbsenceStatus = async (id: number, status: string) => {
    try {
      await api(`/api/admin/absences/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status })
      });
      toast.success(`Justificativa ${status === 'Aprovado' ? 'aprovada' : 'negada'}!`);
      fetchData();
    } catch (error) {
      toast.error("Erro ao atualizar status");
    }
  };

  if (!user || (user.team_name !== "Financeiro" && user.role !== "admin" && user.team_name !== "Presidência")) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
          <Shield className="w-10 h-10 text-destructive" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Acesso Restrito</h2>
          <p className="text-muted-foreground max-w-xs mx-auto">
            Você não tem permissão para acessar esta área.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <motion.div {...fadeIn}>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <PieChart className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Gestão de Pessoal</h1>
        </div>
        <p className="text-muted-foreground ml-11">Relatórios, pontos e justificativas do time</p>
      </motion.div>

      <div className="space-y-8">
        {/* Stats Widgets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Faltas no Mês", value: managementStats.total_absences, icon: AlertCircle, color: "text-orange-500", bg: "bg-orange-500/10" },
            { label: "Atestados", value: managementStats.total_certificates, icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" },
            { label: "Banco de Horas (-)", value: `${managementStats.total_negative_hours}h`, icon: TrendingDown, color: "text-red-500", bg: "bg-red-500/10" },
            { label: "Banco de Horas (+)", value: `${managementStats.total_positive_hours}h`, icon: TrendingUp, color: "text-green-500", bg: "bg-green-500/10" }
          ].map((stat, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6 rounded-3xl border border-border shadow-sm group hover:border-primary/30 transition-all"
            >
              <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{stat.label}</p>
              <p className="text-2xl font-black text-foreground">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Employee Selector & Reports */}
        <div className="glass-card p-8 rounded-[2.5rem] border border-border shadow-2xl relative overflow-hidden bg-muted/20">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 relative z-10">
            <div className="space-y-2">
               <h3 className="text-xl font-bold text-foreground">Relatórios de Ponto</h3>
               <p className="text-sm text-muted-foreground italic">Selecione um funcionário para visualizar e exportar seu espelho de ponto.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              <div className="relative min-w-[280px]">
                <select 
                  className="w-full h-14 pl-12 pr-10 rounded-2xl bg-card border border-border outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm font-bold appearance-none cursor-pointer"
                  onChange={(e) => {
                    const emp = employees.find(ev => ev.id.toString() === e.target.value);
                    setSelectedEmployeeForReport(emp);
                  }}
                >
                  <option value="">-- Selecionar Funcionário --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
                <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>

              {selectedEmployeeForReport && (
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleExportEmployeePDF('daily')}
                    className="flex-1 h-14 px-6 rounded-2xl bg-primary text-primary-foreground font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all"
                  >
                     Relatório Diário <ChevronRight className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleExportEmployeePDF('monthly')}
                    className="flex-1 h-14 px-6 rounded-2xl bg-background border border-border text-muted-foreground font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-card transition-all"
                  >
                     Espelho Mensal <FileText className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-primary/5 blur-3xl rounded-full" />
        </div>

        {/* Pending Absences Review Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold text-foreground">Justificativas Pendentes</h3>
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black">
              {absences.filter(a => a.status === 'Pendente').length} NOVAS
            </span>
          </div>

          <div className="grid gap-4">
            {absences.filter(a => a.status === 'Pendente').length === 0 ? (
              <div className="py-12 text-center glass-card border-dashed border-2 border-border/50 rounded-3xl">
                <p className="text-muted-foreground text-xs italic">Nenhuma justificativa pendente no momento.</p>
              </div>
            ) : (
              absences.filter(a => a.status === 'Pendente').map((abs) => (
                <motion.div 
                  key={abs.id} 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-6 rounded-3xl border border-border hover:border-primary/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center font-black text-primary text-xl shadow-inner">
                      {abs.users?.name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div>
                       <p className="text-sm font-black text-foreground">{abs.users?.name || "Usuário"}</p>
                       <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 rounded-md bg-muted text-[9px] font-black text-muted-foreground uppercase">{abs.category}</span>
                          <span className="text-[10px] text-muted-foreground font-bold">{new Date(abs.absence_date).toLocaleDateString("pt-BR", { timeZone: "UTC" })}</span>
                       </div>
                       <p className="text-xs text-muted-foreground mt-2 italic">“{abs.reason}”</p>
                       {(() => {
                          let meta = abs.metadata;
                          if (typeof meta === 'string') {
                             try { meta = JSON.parse(meta); } catch(e) {}
                          }
                          return meta && Object.keys(meta).length > 0 ? (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {Object.entries(meta).map(([k, v]) => v ? (
                                <span key={k} className="px-2 py-0.5 rounded bg-primary/5 border border-primary/10 text-[9px] font-bold text-primary italic lowercase">
                                  {k}: {v as React.ReactNode}
                                </span>
                              ) : null)}
                            </div>
                          ) : null;
                       })()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                     {abs.attachment_url && (
                        <a 
                          href={`${API_URL}${abs.attachment_url}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="w-12 h-12 rounded-2xl bg-muted border border-border flex items-center justify-center hover:bg-card transition-all text-muted-foreground hover:text-primary mr-2"
                          title="Ver Anexo"
                        >
                          <FileText className="w-5 h-5" />
                        </a>
                     )}
                     <button 
                        onClick={() => handleUpdateAbsenceStatus(abs.id, 'Negado')}
                        className="h-12 px-6 rounded-2xl border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/10 transition-all flex items-center gap-2"
                     >
                       <XCircle className="w-4 h-4" /> Negar
                     </button>
                     <button 
                        onClick={() => handleUpdateAbsenceStatus(abs.id, 'Aprovado')}
                        className="h-12 px-6 rounded-2xl bg-green-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                     >
                       <CheckCircle2 className="w-4 h-4" /> Aprovar
                     </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
